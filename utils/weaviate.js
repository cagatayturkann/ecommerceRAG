const weaviate = require('weaviate-client');

/**
 * Weaviate istemcisini oluşturur
 * @returns {Promise<Object|null>} - Weaviate istemcisi veya null
 */
const getClient = async () => {
  try {
    const wcdUrl = process.env.WEAVIATE_URL;
    const wcdApiKey = process.env.WEAVIATE_API_KEY;

    const client = await weaviate.connectToWeaviateCloud(wcdUrl, {
      authCredentials: new weaviate.ApiKey(wcdApiKey),
    });

    const clientReadiness = await client.isReady();
    if (clientReadiness) {
      console.log('Weaviate bağlantısı başarılı');
      return client;
    } else {
      console.error('Weaviate client is not ready');
      return null;
    }
  } catch (error) {
    console.error('Weaviate bağlantısı kurulamadı:', error);
    return null;
  }
};

module.exports = {
  getClient,
};
