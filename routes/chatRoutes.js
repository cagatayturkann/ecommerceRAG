const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat mesajını işle
router.post('/', chatController.processChat);

module.exports = router; 