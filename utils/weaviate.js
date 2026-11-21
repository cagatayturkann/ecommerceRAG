const weaviate = require('weaviate-client');

const COLLECTION_NAME = 'Product';

let clientPromise = null;

/**
 * Returns a shared Weaviate client.
 * A localhost WEAVIATE_URL connects to the local Docker setup (docker-compose.yml);
 * any other URL is treated as a Weaviate Cloud cluster and needs WEAVIATE_API_KEY.
 */
const getClient = () => {
  if (!clientPromise) {
    const url = new URL(process.env.WEAVIATE_URL || 'http://127.0.0.1:8090');
    const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);

    clientPromise = isLocal
      ? weaviate.connectToLocal({
          host: url.hostname,
          port: Number(url.port || 8080),
          grpcPort: Number(process.env.WEAVIATE_GRPC_PORT || 50051),
        })
      : weaviate.connectToWeaviateCloud(url.toString(), {
          authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
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
