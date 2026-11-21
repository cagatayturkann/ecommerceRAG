const Conversation = require('../models/Conversation');

/**
 * Creates an empty conversation
 * @returns {Promise<Object>} - Created conversation
 */
const createConversation = () => Conversation.create({ title: 'New Conversation', messages: [] });

/**
 * Returns the conversation, or a new one when the ID is unknown (for example after a database reset)
 * @param {String} conversationId - Validated ObjectId string
 * @returns {Promise<Object>} - Conversation
 */
const getConversationById = async (conversationId) =>
  (await Conversation.findById(conversationId)) || createConversation();

/**
 * Appends messages in a single atomic update
 * @param {String} conversationId - Conversation ID
 * @param {Array<{role: String, content: String}>} messages - Messages to append
 */
const addMessages = async (conversationId, messages) => {
  const timestamp = new Date();
  await Conversation.updateOne(
    { _id: conversationId },
    {
      $push: { messages: { $each: messages.map((msg) => ({ ...msg, timestamp })) } },
      $set: { updatedAt: timestamp },
    }
  );
};

/**
 * Returns the most recent messages, oldest first
 * @param {String} conversationId - Conversation ID
 * @param {Number} limit - Maximum number of messages
 * @returns {Promise<Array<Object>>} - Messages
 */
const getConversationMessages = async (conversationId, limit = 10) => {
  const conversation = await Conversation.findById(conversationId, { messages: { $slice: -limit } }).lean();
  return conversation ? conversation.messages : [];
};

module.exports = {
  createConversation,
  getConversationById,
  addMessages,
  getConversationMessages,
};
