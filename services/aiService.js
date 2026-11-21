const Anthropic = require('@anthropic-ai/sdk');
const budgetService = require('./budgetService');

// Answers come from the main model; the cheap query-rewrite step runs on a smaller model.
const ANSWER_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
const REWRITE_MODEL = process.env.ANTHROPIC_REWRITE_MODEL || 'claude-haiku-5-5';

// Reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic({ timeout: 30_000, maxRetries: 2 });

const REWRITE_SCHEMA = {
  type: 'object',
  properties: {
    search_query: {
      type: 'string',
      description:
        'Short English product search query, or an empty string when the message needs no product lookup.',
    },
  },
  required: ['search_query'],
  additionalProperties: false,
};

const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    product_ids: {
      type: 'array',
      items: { type: 'string' },
      description: 'IDs of the PRODUCT CONTEXT items the answer is based on.',
    },
  },
  required: ['answer', 'product_ids'],
  additionalProperties: false,
};

// Turns stored history into Messages API turns. The API requires the first turn to be from the user.
const toMessages = (history) => {
  const turns = history.map((msg) => ({ role: msg.role, content: msg.content }));
  while (turns.length && turns[0].role !== 'user') turns.shift();
  return turns;
};

// Every response counts toward the monthly budget. If recording fails, log it and keep the answer: the next
// request's budget check reads the same database and fails closed if it is down.
const recordUsage = (model, response) =>
  budgetService
    .recordUsage(model, response)
    .catch((error) => console.error('Could not record API usage:', error.message));

const firstText = (response) => response.content.find((block) => block.type === 'text')?.text;

/**
 * Rewrites the latest user message (in any language) into an English search query,
 * resolving follow-ups such as "is it cheaper than the other one?" from the history.
 * Returns '' when no product lookup is needed (greetings, shipping questions, small talk).
 */
const rewriteSearchQuery = async (message, history) => {
  const context = history
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const response = await client.messages.create({
    model: REWRITE_MODEL,
    max_tokens: 2000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: REWRITE_SCHEMA } },
    system:
      'You turn a shopper message into a search query for a product catalogue. ' +
      'Write the query in English, keep it under 12 words, and fold in the product the user means ' +
      'when the message is a follow-up to the conversation. ' +
      'Return an empty query when the message does not ask about products.',
    messages: [
      {
        role: 'user',
        content: `CONVERSATION SO FAR:\n${context || '(none)'}\n\nLATEST MESSAGE:\n${message}`,
      },
    ],
  });
  await recordUsage(REWRITE_MODEL, response);

  if (response.stop_reason !== 'end_turn') return message;
  return JSON.parse(firstText(response)).search_query.trim();
};

/**
 * Answers from the retrieved products only and reports which product IDs the answer used.
 * @param {String} message - Latest user message
 * @param {Array<Object>} products - Retrieved products (already trimmed for the prompt)
 * @param {Array<Object>} history - Earlier turns, oldest first, without the latest message
 * @returns {Promise<{answer: String, productIds: String[]}>}
 */
const generateAnswer = async (message, products, history) => {
  const system = `You are a shopping assistant for an online store. Reply in the language of the user's latest message.
Use only the facts in PRODUCT CONTEXT. Never invent products, prices, stock, specifications or reviews.
If PRODUCT CONTEXT does not answer the question, say so briefly and suggest what the user could ask instead.
Keep the reply short: one or two sentences, then at most three relevant products by name.
In product_ids, list only IDs from PRODUCT CONTEXT that your answer recommends or describes; use an empty list otherwise.

PRODUCT CONTEXT:
${JSON.stringify(products)}`;

  // Server-side fallback: if the model declines a request, the API retries it on a fallback model.
  const response = await client.beta.messages.create({
    model: ANSWER_MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: ANSWER_SCHEMA } },
    system,
    messages: [...toMessages(history), { role: 'user', content: message }],
  });
  await recordUsage(ANSWER_MODEL, response);

  if (response.stop_reason !== 'end_turn') {
    throw new Error(`Answer generation stopped early: ${response.stop_reason}`);
  }

  const { answer, product_ids: productIds } = JSON.parse(firstText(response));
  return { answer, productIds };
};

module.exports = {
  rewriteSearchQuery,
  generateAnswer,
};
