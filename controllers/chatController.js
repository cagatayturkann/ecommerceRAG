const conversationService = require('../services/conversationService');
const vectorService = require('../services/vectorService');
const aiService = require('../services/aiService');
const productService = require('../services/productService');
const { translatorAgent, categorizerAgent, classifierAgent } = require('./agentController');

require('dotenv').config();

const createProductContext = (products) =>
  products.map((product) => {
    const parsedProduct = typeof product === 'string' ? JSON.parse(product) : product;
    return {
      id: String(parsedProduct.id),
      title: parsedProduct.title,
      brand: parsedProduct.brand,
      category: parsedProduct.category,
      description: parsedProduct.description,
      price: parsedProduct.price,
      rating: parsedProduct.rating,
      stock: parsedProduct.stock,
      availabilityStatus: parsedProduct.availabilityStatus,
      warrantyInformation: parsedProduct.warrantyInformation,
      shippingInformation: parsedProduct.shippingInformation,
    };
  });

const expandProductSearchQuery = (query) => {
  const normalizedQuery = query.toLowerCase();

  if (/\b(computer|pc|bilgisayar)\b/.test(normalizedQuery)) {
    return `${query} laptop notebook pc`;
  }

  return query;
};

const normalizeProductCategory = (category, message) => {
  const productIntent = /\b(var mı|var mi|do you have|available|availability|fiyat|price|özellik|feature|öner|recommend)\b/i;
  return category === '[GENERAL_INQUIRY]' && productIntent.test(message)
    ? '[PRODUCT_INFO]'
    : category;
};

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
    const rawCategory = await categorizerAgent(message);
    const category = normalizeProductCategory(rawCategory, message);
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
      isFollowUp = response.trim().toLowerCase() === 'true';
      console.log(`Is follow-up question? ${isFollowUp ? 'Yes' : 'No'}`);
    }

    // Prepare search query
    let searchQuery = expandProductSearchQuery(translatedMessage);

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
      // Give the model a concise, relevant product context instead of full product records.
      const productContext = JSON.stringify(createProductContext(products));

      // Send category and conversation history to AI
      response = await aiService.generateResponse(message, productContext, category, conversationHistory);
      console.log('response', response);

      const productIdsMatch = response.match(/\[PRODUCT_IDS\](.*?)\[\/PRODUCT_IDS\]/);
      const isProductDisplayCategory =
        category === '[PRODUCT_INFO]' || category === '[PRODUCT_RECOMMENDATION]';
      const shouldShowProducts = response.includes('[SHOW_PRODUCT_INFO]') || isProductDisplayCategory;

      // Never expose model control tags in the conversation history or UI.
      response = response
        .replace('[SHOW_PRODUCT_INFO]', '')
        .replace(/\[PRODUCT_IDS\].*?\[\/PRODUCT_IDS\]/, '')
        .trim();
      await conversationService.addMessageToConversation(conversation._id, 'assistant', response);

      // Product cards are a UI rule for product questions, not an unreliable model choice.
      if (shouldShowProducts) {

        let productsToShow;
        if (productIdsMatch) {
          // Get product IDs specified by AI
          let productIds;
          try {
            productIds = JSON.parse(productIdsMatch[1]).ids;
          } catch (error) {
            console.warn('Invalid product ID payload from AI response. Showing all retrieved products.');
          }

          productsToShow = Array.isArray(productIds)
            ? products.filter((product) => {
                const parsedProduct = typeof product === 'string' ? JSON.parse(product) : product;
                return productIds.includes(parsedProduct.id.toString());
              })
            : products;

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
      response = await aiService.generateResponse(message, productInfo, category, conversationHistory);
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
