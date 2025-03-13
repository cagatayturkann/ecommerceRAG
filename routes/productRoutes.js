const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Ürün detay sayfası
router.get('/:id', productController.getProductDetail);

module.exports = router; 