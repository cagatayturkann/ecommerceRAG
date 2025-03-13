const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

// Tüm konuşmaları getir
router.get('/', conversationController.getAllConversations);

// Yeni bir konuşma oluştur
router.post('/', conversationController.createConversation);

// Bir konuşmayı ID'ye göre getir
router.get('/:id', conversationController.getConversationById);

// Bir konuşmanın mesajlarını getir
router.get('/:id/messages', conversationController.getConversationMessages);

// Bir konuşmayı sil
router.delete('/:id', conversationController.deleteConversation);

module.exports = router; 