const conversationService = require('../services/conversationService');
const vectorService = require('../services/vectorService');
const aiService = require('../services/aiService');
const productService = require('../services/productService');

const MAX_MESSAGE_LENGTH = 500;
const HISTORY_TURNS = 4;
const CONVERSATION_TOKEN_PATTERN = /^[a-f0-9]{32}$/;

// Only the fields the model needs to answer; keeps the prompt small and free of reviewer e-mails etc.
const toPromptProduct = (product) => ({
  id: String(product.id),
  title: product.title,
  brand: product.brand,
  category: product.category,
  description: product.description,
  price: product.price,
  rating: product.rating,
  stock: product.stock,
  availabilityStatus: product.availabilityStatus,
  warrantyInformation: product.warrantyInformation,
  shippingInformation: product.shippingInformation,
  returnPolicy: product.returnPolicy,
});

const parseChatRequest = (body) => {
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return { error: `message must be a non-empty string of at most ${MAX_MESSAGE_LENGTH} characters` };
  }

  const { conversationId } = body;
  if (conversationId != null && (typeof conversationId !== 'string' || !CONVERSATION_TOKEN_PATTERN.test(conversationId))) {
    return { error: 'conversationId must be a 32-character lowercase hex string' };
  }

  return { message, conversationId };
};

/**
 * POST /api/chat
 * 1. Rewrite the message into an English search query (handles other languages and follow-ups).
 * 2. Retrieve the nearest products from Weaviate.
 * 3. Answer from those products only; the model returns the product IDs it used.
 * 4. Show product cards only for IDs that were actually retrieved.
 */
const processChat = async (req, res, next) => {
  const parsed = parseChatRequest(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const { message, conversationId } = parsed;
    const conversation = conversationId
      ? await conversationService.getConversationByToken(conversationId)
      : await conversationService.createConversation();

    const history = await conversationService.getConversationMessages(conversation.token, HISTORY_TURNS);
    const searchQuery = await aiService.rewriteSearchQuery(message, history);
    const products = searchQuery ? await vectorService.searchProducts(searchQuery) : [];

    const { answer, productIds } = await aiService.generateAnswer(
      message,
      products.map(toPromptProduct),
      history
    );

    // Drop any ID the model returned that was not in the retrieved set.
    const citedProducts = products.filter((product) => productIds.includes(String(product.id)));

    await conversationService.addMessages(conversation.token, [
      { role: 'user', content: message },
      { role: 'assistant', content: answer },
    ]);

    res.json({
      response: productService.renderAnswer(answer, citedProducts),
      answer,
      productIds: citedProducts.map((product) => String(product.id)),
      conversationId: conversation.token,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processChat,
};
