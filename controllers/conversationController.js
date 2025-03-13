const conversationService = require('../services/conversationService');

/**
 * Yeni bir konuşma oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const createConversation = async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await conversationService.createConversation(title);
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

/**
 * Bir konuşmayı ID'ye göre getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const getConversationById = async (req, res) => {
  try {
    const conversation = await conversationService.getConversationById(req.params.id);
    res.json(conversation);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(404).json({ error: 'Conversation not found' });
  }
};

/**
 * Bir konuşmanın mesajlarını getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const getConversationMessages = async (req, res) => {
  try {
    const conversation = await conversationService.getConversationById(req.params.id);
    res.json(conversation.messages);
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    res.status(404).json({ error: 'Conversation not found' });
  }
};

/**
 * Tüm konuşmaları getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const getAllConversations = async (req, res) => {
  try {
    const conversations = await conversationService.getAllConversations();
    res.json(conversations);
  } catch (error) {
    console.error('Error getting all conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

/**
 * Bir konuşmayı siler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
const deleteConversation = async (req, res) => {
  try {
    await conversationService.deleteConversation(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(404).json({ error: 'Conversation not found' });
  }
};

module.exports = {
  createConversation,
  getConversationById,
  getConversationMessages,
  getAllConversations,
  deleteConversation
}; 