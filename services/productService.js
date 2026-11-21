const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Everything that reaches the widget's innerHTML goes through this, including model output.
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const renderProductCard = (product) => `
      <div class="product-card">
        <div class="product-image">
          <img src="${escapeHtml(product.thumbnail || product.images?.[0])}"
               alt="${escapeHtml(product.title || 'Product image')}"
               loading="lazy">
        </div>
        <div class="product-info">
          <h3 class="product-title">${escapeHtml(product.title || 'Name not specified')}</h3>
          <p class="product-description">${escapeHtml(product.description || 'Description not specified')}</p>
          <div class="product-price-container">
            <span class="product-price">$${escapeHtml(product.price ?? 'Price not specified')}</span>
          </div>
          <a href="/product/${encodeURIComponent(product.id)}" class="product-detail-button" target="_blank" rel="noopener">
            More Details
          </a>
        </div>
      </div>`;

/**
 * Builds the HTML the widget shows: the escaped answer text followed by cards for the cited products.
 * @param {String} answer - Model answer (plain text)
 * @param {Array<Object>} products - Products the answer cited
 * @returns {String} - HTML
 */
const renderAnswer = (answer, products) => {
  const text = `<p>${escapeHtml(answer).replace(/\n/g, '<br>')}</p>`;
  if (!products.length) return text;
  return `${text}<div class="products-container">${products.map(renderProductCard).join('')}</div>`;
};

module.exports = {
  escapeHtml,
  renderAnswer,
};
