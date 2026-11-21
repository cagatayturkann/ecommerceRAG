const fs = require('fs');
const path = require('path');
const { escapeHtml: e } = require('../services/productService');

// The catalogue is static, so it is read once at startup.
const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/files/products.json'), 'utf8'));

/**
 * Renders the product detail page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProductDetail = (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = Number.isInteger(productId) ? products.find((p) => p.id === productId) : null;

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Create HTML page
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${e(product.title)} - Product Detail</title>
      <style>
        :root {
          --primary-color: #0F1923;
          --secondary-color: #0A1428;
          --accent-color: #2563EB;
          --text-primary: #fff;
          --text-secondary: #4B5563;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: var(--primary-color);
          color: var(--text-primary);
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .product-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 30px;
        }
        
        .product-images {
          display: flex;
          flex-direction: column;
        }
        
        .main-image {
          width: 100%;
          height: 400px;
          object-fit: contain;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        
        .image-thumbnails {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 10px;
        }
        
        .thumbnail {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.3s;
        }
        
        .thumbnail.active {
          border-color: var(--accent-color);
        }
        
        .product-info h1 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        
        .product-rating {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .stars {
          display: flex;
          margin-right: 10px;
        }
        
        .star {
          color: #ffc107;
          font-size: 18px;
        }
        
        .price-container {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .price {
          font-size: 24px;
          font-weight: bold;
          color: var(--accent-color);
        }
        
        .original-price {
          text-decoration: line-through;
          color: var(--text-secondary);
          margin-right: 10px;
        }
        
        .discount {
          background-color: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          margin-left: 10px;
        }
        
        .description {
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-weight: bold;
          margin-bottom: 5px;
          color: var(--text-secondary);
        }
        
        .detail-value {
          color: var(--text-primary);
        }
        
        .reviews-section {
          margin-top: 40px;
        }
        
        .reviews-section h2 {
          margin-bottom: 20px;
          border-bottom: 1px solid var(--text-secondary);
          padding-bottom: 10px;
        }
        
        .review {
          background-color: var(--secondary-color);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        
        .review-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .review-rating {
          display: flex;
        }
        
        .review-date {
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .review-comment {
          line-height: 1.5;
        }
        
        @media (max-width: 768px) {
          .product-detail {
            grid-template-columns: 1fr;
          }
          
          .main-image {
            height: 300px;
          }
          
          .details {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="product-detail">
          <div class="product-images">
            <img src="${e(product.images && product.images.length > 0 ? product.images[0] : product.thumbnail)}" alt="${e(product.title)}" class="main-image" id="mainImage">
            
            ${product.images && product.images.length > 0 ? `
            <div class="image-thumbnails">
              ${product.images.map((image, index) => `
                <img src="${e(image)}" alt="${e(product.title)} - Image ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}">
              `).join('')}
            </div>
            ` : ''}
          </div>
          
          <div class="product-info">
            <h1>${e(product.title)}</h1>
            
            <div class="product-rating">
              <div class="stars">
                ${Array(5).fill().map((_, i) => `<span class="star">${i < Math.floor(product.rating || 0) ? '★' : '☆'}</span>`).join('')}
              </div>
              <span>${product.rating ? product.rating.toFixed(1) : 'N/A'}</span>
            </div>
            
            <div class="price-container">
              ${product.discountPercentage ? `
                <span class="original-price">$${(product.price / (1 - product.discountPercentage / 100)).toFixed(2)}</span>
              ` : ''}
              <span class="price">$${product.price}</span>
              ${product.discountPercentage ? `
                <span class="discount">${product.discountPercentage}% off</span>
              ` : ''}
            </div>
            
            <div class="description">
              <p>${e(product.description)}</p>
            </div>
            
            <div class="details">
              <div class="detail-item">
                <span class="detail-label">Category</span>
                <span class="detail-value">${e(product.category || 'Not specified')}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Brand</span>
                <span class="detail-value">${e(product.brand || 'Not specified')}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Stock Status</span>
                <span class="detail-value">${product.stock ? `${product.stock} units` : 'Not specified'}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">SKU</span>
                <span class="detail-value">${e(product.sku || 'Not specified')}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Warranty</span>
                <span class="detail-value">${e(product.warrantyInformation || 'Not specified')}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Shipping</span>
                <span class="detail-value">${e(product.shippingInformation || 'Not specified')}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Returns</span>
                <span class="detail-value">${e(product.returnPolicy || 'Not specified')}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value">${e(product.availabilityStatus || 'Not specified')}</span>
              </div>
            </div>
          </div>
        </div>
        
        ${product.reviews && product.reviews.length > 0 ? `
        <div class="reviews-section">
          <h2>Customer Reviews (${product.reviews.length})</h2>
          
          ${product.reviews.map(review => `
            <div class="review">
              <div class="review-header">
                <div class="review-rating">
                  ${Array(5).fill().map((_, i) => `<span class="star">${i < Math.floor(review.rating || 0) ? '★' : '☆'}</span>`).join('')}
                </div>
                <span class="review-date">${new Date(review.date).toLocaleDateString('en-US')}</span>
              </div>
              <div class="review-comment">
                <p>${e(review.comment)}</p>
              </div>
              <div class="reviewer-info">
                <p>By: ${e(review.reviewerName)}</p>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
      
      <script>
        document.querySelectorAll('.thumbnail').forEach((thumbnail) => {
          thumbnail.addEventListener('click', () => {
            document.getElementById('mainImage').src = thumbnail.src;
            document.querySelectorAll('.thumbnail').forEach((thumb) => thumb.classList.remove('active'));
            thumbnail.classList.add('active');
          });
        });
      </script>

      <script src="/js/widget.js"></script>
    </body>
    </html>
    `;
    
    // Send HTML page
    res.send(html);
  } catch (error) {
    console.error('Product detail page error:', error);
    res.status(500).send('Something went wrong.');
  }
};

module.exports = {
  getProductDetail
}; 