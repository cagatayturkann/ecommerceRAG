const express = require('express');
const router = express.Router();
const chatRoutes = require('./chatRoutes');
const productRoutes = require('./productRoutes');

router.use('/api/chat', chatRoutes);

// Product detail page linked from the product cards
router.use('/product', productRoutes);

module.exports = router;
