/**
 * Formats product information into HTML for display
 * @param {Array} products - Array of product objects
 * @returns {String} - HTML formatted product information
 */
const formatProductInfo = (products) => {
  if (!products || products.length === 0) {
    return 'No relevant product information found.';
  }

  if (products.error) {
    return products.message;
  }

  let productsHTML = '<div class="products-container">';

  products.forEach((product) => {
    const parsedProduct = typeof product === 'string' ? JSON.parse(product) : product;

    productsHTML += `
      <div class="product-card">
        <div class="product-image">
          <img src="${parsedProduct.thumbnail || parsedProduct.images?.[0]}" 
               alt="${parsedProduct.title || 'Product Image'}" 
               loading="lazy">
        </div>
        <div class="product-info">
          <h3 class="product-title">${parsedProduct.title || 'Name not specified'}</h3>
          <p class="product-description">${parsedProduct.description || 'Description not specified'}</p>
          <div class="product-price-container">
            <span class="product-price">$${parsedProduct.price || 'Price not specified'}</span>
          </div>
          <a href="/product/${parsedProduct.id}" class="product-detail-button" target="_blank">
            More Details
          </a>
        </div>
      </div>
    `;
  });

  productsHTML += '</div>';
  return productsHTML;
};

module.exports = {
  formatProductInfo
}; 