const weaviate = require('weaviate-client');

const COLLECTION_NAME = 'Product';

let clientPromise = null;

/**
 * Returns a shared Weaviate client.
 * An http:// WEAVIATE_URL is a self-hosted Weaviate (docker-compose.yml locally, docker-compose.coolify.yml
 * in production), with an optional WEAVIATE_API_KEY; an https:// URL is a Weaviate Cloud cluster and needs one.
 */
const getClient = () => {
  if (!clientPromise) {
    const url = new URL(process.env.WEAVIATE_URL || 'http://127.0.0.1:8090');
    const apiKey = process.env.WEAVIATE_API_KEY;

    clientPromise =
      url.protocol === 'http:'
        ? weaviate.connectToLocal({
            host: url.hostname,
            port: Number(url.port || 8080),
            grpcPort: Number(process.env.WEAVIATE_GRPC_PORT || 50051),
            authCredentials: apiKey ? new weaviate.ApiKey(apiKey) : undefined,
          })
        : weaviate.connectToWeaviateCloud(url.toString(), {
            authCredentials: new weaviate.ApiKey(apiKey),
          });

    // Let the next call retry instead of caching a failed connection.
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }
  return clientPromise;
};

module.exports = {
  COLLECTION_NAME,
  getClient,
};
