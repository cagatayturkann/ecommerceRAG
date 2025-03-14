const axios = require('axios');

require('dotenv').config();

/**
 * Translates user messages to English
 * @param {String} message - User message to translate
 * @returns {String} - Translated message in English
 */
const translatorAgent = async (message) => {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Chatbot',
      },
      data: {
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content: `You are a sophisticated AI agent specializing in translating user queries from multiple languages into English. Before translating, you identify and correct typos, grammatical errors, and punctuation mistakes in the source text to ensure clarity and readability. Your translations should maintain the original context and be culturally nuanced. You also verify that the translated English text is free of errors, providing precise and reliable communication for the chatbot. Return only the translated text as plain text, without any line breaks, including the "\n" character, HTML elements, special characters, or trailing newline characters. Ensure the output is a continuous string of text.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
      },
    });

    return response.data.choices[0].message.content.replace(/\n+$/, '');
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return 'Sorry, an error occurred while generating a response: ' + error.message;
  }
};

/**
 * Categorizes user messages into predefined categories
 * @param {String} message - User message to categorize
 * @returns {String} - Category of the message
 */
const categorizerAgent = async (message) => {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Chatbot',
      },
      data: {
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content: `You are a sophisticated AI agent specializing in categorizing user queries into one of the following categories:
            [PRODUCT_INFO] - Questions about product information, features, specifications, price, existence, availability, etc.
            [PRODUCT_COMPARISON] - Questions comparing multiple products,
            [PRODUCT_RECOMMENDATION] - Questions asking for product recommendations
            [PRODUCT_REVIEWS] - Questions about product reviews or ratings
            [GENERAL_INQUIRY] - General questions not related to specific products
            [CUSTOMER_SERVICE] - Questions about customer service, shipping, returns, etc.
            [OTHER] - Any other type of question
            
            Return only the category as plain text, without any line breaks, including the "\n" character, HTML elements, special characters, or trailing newline characters. Ensure the output is a continuous string of text.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
      },
    });

    return response.data.choices[0].message.content.replace(/\n+$/, '');
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return '[GENERAL_INQUIRY]';
  }
};

/**
 * Determines if a message is a follow-up question based on conversation history
 * @param {Array} conversationHistory - Array of previous conversation messages
 * @returns {String} - JSON string indicating if message is a follow-up (true/false)
 */
const classifierAgent = async (conversationHistory) => {
  try {
    // Format conversation history for the AI model
    const formattedHistory = conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Chatbot',
      },
      data: {
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content: `You are a sophisticated AI agent specializing in determining if a user's message is a follow-up question to a previous conversation. A follow-up question is a question that refers to or builds upon a previous question or response in the conversation. For example, if a user asks about a product and then asks about its price, the second question is a follow-up question.

            Analyze the conversation history and determine if the last user message is a follow-up question. Return only a JSON boolean value (true or false) as plain text, without any line breaks, including the "\n" character, HTML elements, special characters, or trailing newline characters. Ensure the output is a continuous string of text.`,
          },
          {
            role: 'user',
            content: `Here is the conversation history:\n${formattedHistory}\n\nIs the last user message a follow-up question?`,
          },
        ],
      },
    });

    return response.data.choices[0].message.content.replace(/\n+$/, '');
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return 'false';
  }
};

module.exports = {
  translatorAgent,
  categorizerAgent,
  classifierAgent,
};
