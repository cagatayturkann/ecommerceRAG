const Conversation = require('../models/Conversation');

/**
 * Creates a new conversation
 * @param {String} title - Conversation title (optional)
 * @returns {Promise<Object>} - Created conversation
 */
const createConversation = async (title = null) => {
  try {
    // Assign default title if null
    const conversationTitle = title || 'New Conversation';
    
    const conversation = new Conversation({
      title: conversationTitle,
      messages: []
    });
    
    await conversation.save();
    return conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Retrieves a conversation by ID
 * @param {String} conversationId - Conversation ID
 * @returns {Promise<Object>} - Found conversation
 */
const getConversationById = async (conversationId) => {
  try {
    // Check ObjectId format
    const mongoose = require('mongoose');
    let isValidObjectId = false;
    
    try {
      isValidObjectId = mongoose.Types.ObjectId.isValid(conversationId);
    } catch (error) {
      isValidObjectId = false;
    }
    
    // Create a new conversation if not a valid ObjectId
    if (!isValidObjectId) {
      console.log(`Invalid ObjectId format: ${conversationId}, creating new conversation...`);
      return await createConversation();
    }
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log(`Conversation not found with ID: ${conversationId}, creating new conversation...`);
      return await createConversation();
    }
    
    return conversation;
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    throw error;
  }
};

/**
 * Retrieves all conversations
 * @returns {Promise<Array>} - List of all conversations
 */
const getAllConversations = async () => {
  try {
    const conversations = await Conversation.find().sort({ updatedAt: -1 });
    return conversations;
  } catch (error) {
    console.error('Error retrieving all conversations:', error);
    throw error;
  }
};

/**
 * Adds a message to a conversation
 * @param {String} conversationId - Conversation ID
 * @param {String} role - Message role (user/assistant)
 * @param {String} content - Message content
 * @returns {Promise<Object>} - Updated conversation
 */
const addMessageToConversation = async (conversationId, role, content) => {
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found with ID: ${conversationId}`);
    }
    
    conversation.messages.push({
      role,
      content,
      timestamp: new Date()
    });
    
    conversation.updatedAt = new Date();
    await conversation.save();
    return conversation;
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    throw error;
  }
};

/**
 * Deletes a conversation
 * @param {String} conversationId - Conversation ID
 * @returns {Promise<Boolean>} - Success status
 */
const deleteConversation = async (conversationId) => {
  try {
    const result = await Conversation.findByIdAndDelete(conversationId);
    if (!result) {
      throw new Error(`Conversation not found with ID: ${conversationId}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Retrieves messages from a conversation with optional limit
 * @param {String} conversationId - Conversation ID
 * @param {Number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Array>} - List of messages
 */
const getConversationMessages = async (conversationId, limit = 10) => {
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found with ID: ${conversationId}`);
    }
    
    // Get the most recent messages based on limit
    const messages = conversation.messages;
    const startIndex = Math.max(0, messages.length - limit);
    return messages.slice(startIndex);
  } catch (error) {
    console.error('Error retrieving conversation messages:', error);
    throw error;
  }
};

module.exports = {
  createConversation,
  getConversationById,
  getAllConversations,
  addMessageToConversation,
  deleteConversation,
  getConversationMessages
}; 