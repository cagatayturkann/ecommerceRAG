const { OpenAI } = require('openai');

require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL_NAME = 'llama-3.3-70b-versatile';
const groq = GROQ_API_KEY
  ? new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

async function generateText(systemPrompt, userPrompt, fallback) {
  if (!groq) {
    console.error('GROQ_API_KEY is missing.');
    return fallback;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      temperature: 0,
      max_tokens: 120,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || fallback;
  } catch (error) {
    console.error('Groq agent error:', error.message);
    return fallback;
  }
}

const translatorAgent = (message) =>
  generateText(
    'Translate the user message into clear English. Correct obvious typos and grammar while preserving meaning. Return only the translation as plain text.',
    message,
    message
  );

const categorizerAgent = (message) =>
  generateText(
    `Classify the user message into exactly one of these labels:
[PRODUCT_INFO], [PRODUCT_COMPARISON], [PRODUCT_RECOMMENDATION], [PRODUCT_REVIEWS], [GENERAL_INQUIRY], [CUSTOMER_SERVICE], [OTHER].
Return only the label.`,
    message,
    '[GENERAL_INQUIRY]'
  );

const classifierAgent = (conversationHistory) => {
  const formattedHistory = conversationHistory
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  return generateText(
    'Determine whether the final user message follows up on the prior conversation. Return only the JSON boolean true or false.',
    formattedHistory,
    'false'
  );
};

module.exports = {
  translatorAgent,
  categorizerAgent,
  classifierAgent,
};
