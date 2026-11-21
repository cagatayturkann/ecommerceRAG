const { COLLECTION_NAME, getClient } = require('../utils/weaviate');

/**
 * Semantic product search. Weaviate embeds the query with the same Model2Vec model
 * that embedded the products at seed time, then returns the nearest products.
 * @param {String} query - English search query
 * @param {Number} limit - Maximum number of products
 * @returns {Promise<Array<Object>>} - Full product records, nearest first
 */
const searchProducts = async (query, limit = 3) => {
  const client = await getClient();
  const products = client.collections.use(COLLECTION_NAME);

  const result = await products.query.nearText(query, {
    limit,
    returnProperties: ['data'],
  });

  return result.objects.map((item) => JSON.parse(item.properties.data));
};

module.exports = {
  searchProducts,
};
