const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const MODEL_NAME = 'gemini-2.5-flash-lite';

async function generateText(systemInstruction, prompt, fallback) {
  if (!genAI) {
    console.error('GEMINI_API_KEY is missing.');
    return fallback;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction,
    });
    const response = await model.generateContent(prompt);
    return response.response.text().trim();
  } catch (error) {
    console.error('Gemini agent error:', error.message);
    return fallback;
  }
}

/**
 * Translates user messages to English.
 * @param {String} message - User message to translate
 * @returns {Promise<String>} Translated message in English
 */
const translatorAgent = (message) =>
  generateText(
    'Translate the user message into clear English. Correct obvious typos and grammar while preserving meaning. Return only the translation as plain text.',
    message,
    message
  );

/**
 * Categorizes user messages into predefined categories.
 * @param {String} message - User message to categorize
 * @returns {Promise<String>} Category of the message
 */
const categorizerAgent = (message) =>
  generateText(
    `Classify the user message into exactly one of these labels:
[PRODUCT_INFO], [PRODUCT_COMPARISON], [PRODUCT_RECOMMENDATION], [PRODUCT_REVIEWS], [GENERAL_INQUIRY], [CUSTOMER_SERVICE], [OTHER].
Return only the label.`,
    message,
    '[GENERAL_INQUIRY]'
  );

/**
 * Determines if the latest message is a follow-up to earlier conversation.
 * @param {Array} conversationHistory - Previous conversation messages
 * @returns {Promise<String>} JSON boolean text: true or false
 */
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
