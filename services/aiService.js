const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');
const axios = require('axios');
require('dotenv').config();
const { productService } = require('../services/productService');

// Get API keys from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize API clients
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * Generates a response using Gemini or falls back to OpenRouter API
 * @param {String} prompt - User message
 * @param {String} context - Product information or other context
 * @param {String} category - Message category
 * @param {Array} conversationHistory - Conversation history
 * @returns {String} - AI response
 */
const generateGeminiResponse = async (prompt, context, category, conversationHistory = []) => {
  try {
    console.log('contextMessage', context);

    // Format conversation history for the AI model
    const formattedHistory = conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const messageContent = `
      You are a helpful shopping assistant that can answer questions about products. Based on the user's question "${prompt}", analyze the product information in the context: ${context} and return information only about the most relevant matching product(s). Answer questions related to the ${category} of the product(s). Answer as humanly as possible and in the same language as the ${prompt}, but be careful with special names such as brand, model, etc. - don't translate those.
      
      If the category is [PRODUCT_INFO] or [PRODUCT_RECOMMENDATION] and the question is about general product information (like price, features, specifications etc), include [SHOW_PRODUCT_INFO] at the end of your response so that product information can be formatted and displayed to the user.
      
      If the question is specifically about product reviews, ratings or customer feedback, do not include [SHOW_PRODUCT_INFO]. Instead, focus on providing a summary of the reviews and ratings from the available data.

      Also consider follow up questions. If the user asks a follow up question about a product mentioned earlier, your answer should be about the SAME product. Do not switch to a different product unless the user explicitly asks about a new product. Even if there are other matching products in the context, do not switch to a different product unless explicitly asked.

      IMPORTANT: Maintain context from previous messages. If the user asks a follow-up question about a product mentioned earlier, your answer should be about the SAME product. Do not switch to a different product unless the user explicitly asks about a new product.

      For example:
      User: "What Apple products do you have?"
      Assistant: "We have MacBook Pro 14 inch..." (about Apple MacBook)
      User: "What is the warranty period?"
      Assistant: "The warranty period for the MacBook Pro is..." (should continue talking about the MacBook, not switch to a different product)

      At the end of your response, after [SHOW_PRODUCT_INFO],include a JSON object with an array of product IDs that you referenced in your answer, in the format: [PRODUCT_IDS]{"ids":["id1","id2"]}[/PRODUCT_IDS]

      Here is the conversation history so far:
      ${formattedHistory}
      
      User: ${prompt}
      Assistant:
    `;

    try {
      // Use Gemini API
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: messageContent,
      });

      const res = await model.generateContent(prompt);
      return res.response.text();
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Sorry, an error occurred while generating a response: ' + error.message;
  }
};

module.exports = {
  generateGeminiResponse,
};
