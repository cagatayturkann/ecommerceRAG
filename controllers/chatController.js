const conversationService = require('../services/conversationService');
const vectorService = require('../services/vectorService');
const aiService = require('../services/aiService');
const productService = require('../services/productService');
const { translatorAgent, categorizerAgent, classifierAgent } = require('./agentController');

require('dotenv').config();

/**
 * Processes chat messages and generates AI responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processChat = async (req, res) => {
  try {
    let { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Incoming message: "${message}"`);
    console.log(`Conversation ID: ${conversationId || 'New conversation'}`);

    // Categorize the message
    const category = await categorizerAgent(message);
    console.log(`Message category: "${category}"`);

    // Get existing conversation or create new one
    let conversation;
    try {
      if (conversationId) {
        conversation = await conversationService.getConversationById(conversationId);
      } else {
        conversation = await conversationService.createConversation();
      }
    } catch (error) {
      console.error('Conversation processing error:', error);
      // Create a new conversation in case of error
      conversation = await conversationService.createConversation();
    }

    // Add user message to conversation
    await conversationService.addMessageToConversation(conversation._id, 'user', message);

    // Get conversation history (last 4 messages)
    const conversationHistory = await conversationService.getConversationMessages(conversation._id, 4);
    console.log(`Conversation history retrieved: ${conversationHistory.length} messages`);

    // Translate message to English
    let translatedMessage = await translatorAgent(message);
    console.log(`Translated message: "${translatedMessage}"`);

    // Determine if message is a follow-up question
    let isFollowUp = false;

    // If conversation has at least 3 messages (previous user question, bot response, and current question)
    if (conversationHistory.length >= 3) {
      // Use classifierAgent to determine if it's a follow-up
      const response = await classifierAgent(conversationHistory);
      const parsedResponse = JSON.parse(response);
      isFollowUp = parsedResponse;
      console.log(`Is follow-up question? ${isFollowUp ? 'Yes' : 'No'}`);
    }

    // Prepare search query
    let searchQuery = translatedMessage;

    // If it's a follow-up question, include previous user questions
    if (isFollowUp && conversationHistory.length >= 3) {
      // Find previous user messages (last 2 user messages)
      const userMessages = conversationHistory.filter((msg) => msg.role === 'user').slice(-2);

      if (userMessages.length >= 2) {
        const previousUserMessage = userMessages[0].content; // Previous user message
        searchQuery = `${await translatorAgent(previousUserMessage)} ${translatedMessage}`;
        console.log(`Expanded search query (follow-up): "${searchQuery}"`);
      }
    }
    console.log('searchQuery', searchQuery, '\n');

    // Get product information from Weaviate
    const products = await vectorService.getProductInfo(searchQuery);

    // Process response based on product information
    let response;
    if (products && products.length > 0) {
      // Send product information to AI in JSON format
      const productContext = JSON.stringify(products);

      // Send category and conversation history to AI
      response = await aiService.generateGeminiResponse(message, productContext, category, conversationHistory);
      console.log('response', response);
      
      // Clean [SHOW_PRODUCT_INFO] tag
      const cleanedResponse = response.replace('[SHOW_PRODUCT_INFO]', '');
      await conversationService.addMessageToConversation(conversation._id, 'assistant', cleanedResponse);

      // Check if product information should be displayed
      if (response.includes('[SHOW_PRODUCT_INFO]')) {
        // Remove [SHOW_PRODUCT_INFO] tag from AI response
        response = response.replace('[SHOW_PRODUCT_INFO]', '');

        // Extract product IDs from AI response
        const productIdsMatch = response.match(/\[PRODUCT_IDS\](.*?)\[\/PRODUCT_IDS\]/);

        let productsToShow;
        if (productIdsMatch) {
          // Get product IDs specified by AI
          const productIds = JSON.parse(productIdsMatch[1]).ids;

          // Filter products to only show those with specified IDs
          productsToShow = products.filter((product) => {
            const parsedProduct = typeof product === 'string' ? JSON.parse(product) : product;
            return productIds.includes(parsedProduct.id.toString());
          });

          // Remove ID tags from response
          response = response.replace(/\[PRODUCT_IDS\].*?\[\/PRODUCT_IDS\]/, '');
        } else {
          // Show all products if no IDs specified
          productsToShow = products;
        }

        // Format product information and add to response
        const productInfo = productService.formatProductInfo(productsToShow);
        response = response + productInfo;
      }
    } else {
      // If no product information or different question, send to Gemini API
      const productInfo = JSON.stringify({ message: 'No relevant product information found.' });
      response = await aiService.generateGeminiResponse(message, productInfo, category, conversationHistory);
      const cleanedResponse = response.replace('[SHOW_PRODUCT_INFO]', '');
      await conversationService.addMessageToConversation(conversation._id, 'assistant', cleanedResponse);
    }

    // Return response
    res.json({
      response: response,
      conversationId: conversation._id.toString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ error: 'An error occurred while processing the message: ' + error.message });
  }
};

module.exports = {
  processChat,
};
