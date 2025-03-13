const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Get API keys from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize API client
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Generates an embedding vector for the given text
 * @param {String} text - Text to generate embedding for
 * @returns {Array} - Embedding vector
 */
async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Retrieves product information from Weaviate vector database
 * @param {String} query - Search query
 * @returns {Array} - Product information
 */
const getProductInfo = async (query) => {
  try {
    const embedding = await getEmbedding(query);

    // Use fixed alpha value for vector search
    const alpha = 0.5;

    console.log(`Vector search alpha: ${alpha}`);

    // Clean query text for GraphQL - make it safe
    // Remove special characters and quotes
    const cleanQuery = query
      .substring(0, 100) // Keep query at reasonable length
      .replace(/[^\w\s]/gi, '') // Remove non-alphanumeric characters
      .replace(/"/g, '') // Remove double quotes
      .trim();

    console.log(`Cleaned query: "${cleanQuery}"`);

    const data = JSON.stringify({
      query: `{
        Get {
          Ecommerce (
            hybrid: {
              query: "${cleanQuery}"
              alpha: ${alpha},
              vector: ${JSON.stringify(embedding)},
            }
            limit: 3
          ) {
            data
            _additional { score }
          }
        }
      }`,
    });

    const config = {
      method: 'post',
      url: process.env.WEAVIATE_URL + '/v1/graphql',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}`,
      },
      data: data,
    };

    const response = await axios.request(config);

    console.log('response.data.data.Get.Ecommerce', response.data.data.Get.Ecommerce);
    return response.data.data.Get.Ecommerce.map((item) => item.data);
  } catch (error) {
    console.error('Error during Weaviate query:', error);
    return [];
  }
};

module.exports = {
  getEmbedding,
  getProductInfo
}; 