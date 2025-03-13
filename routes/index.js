const express = require('express');
const router = express.Router();
const chatRoutes = require('./chatRoutes');
const conversationRoutes = require('./conversationRoutes');
const productRoutes = require('./productRoutes');

// API routes
router.use('/api/chat', chatRoutes);
router.use('/api/conversations', conversationRoutes);

// Ürün detay sayfası
router.use('/product', productRoutes);

module.exports = router; 