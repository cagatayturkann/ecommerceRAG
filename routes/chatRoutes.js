const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const rateLimit = require('../middlewares/rateLimit');

const chatLimiter = rateLimit({
  limit: Number(process.env.CHAT_RATE_LIMIT_PER_MINUTE) || 20,
  windowMs: 60 * 1000,
});

router.post('/', chatLimiter, chatController.processChat);

module.exports = router;
