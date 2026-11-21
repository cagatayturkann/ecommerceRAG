const crypto = require('crypto');
const Conversation = require('../models/Conversation');

/**
 * Creates an empty conversation with a random 128-bit token (32 hex characters)
 * @returns {Promise<Object>} - Created conversation
 */
const createConversation = () =>
  Conversation.create({ token: crypto.randomBytes(16).toString('hex'), title: 'New Conversation', messages: [] });

/**
 * Returns the conversation, or a new one when the token is unknown (for example after a database reset)
 * @param {String} token - Validated conversation token
 * @returns {Promise<Object>} - Conversation
 */
const getConversationByToken = async (token) =>
  (await Conversation.findOne({ token })) || createConversation();

/**
 * Appends messages in a single atomic update
 * @param {String} token - Conversation token
 * @param {Array<{role: String, content: String}>} messages - Messages to append
 */
const addMessages = async (token, messages) => {
  const timestamp = new Date();
  await Conversation.updateOne(
    { token },
    {
      $push: { messages: { $each: messages.map((msg) => ({ ...msg, timestamp })) } },
      $set: { updatedAt: timestamp },
    }
  );
};

/**
 * Returns the most recent messages, oldest first
 * @param {String} token - Conversation token
 * @param {Number} limit - Maximum number of messages
 * @returns {Promise<Array<Object>>} - Messages
 */
const getConversationMessages = async (token, limit = 10) => {
  const conversation = await Conversation.findOne({ token }, { messages: { $slice: -limit } }).lean();
  return conversation ? conversation.messages : [];
};

module.exports = {
  createConversation,
  getConversationByToken,
  addMessages,
  getConversationMessages,
};
