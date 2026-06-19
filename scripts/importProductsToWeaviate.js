const fs = require('fs');
const path = require('path');
const weaviate = require('weaviate-client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();

const COLLECTION_NAME = 'Ecommerce';
const MAX_RETRIES = 3;

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value || value.includes('replace_with') || value.includes('replace-with')) {
    throw new Error(`${name} is missing. Add it to .env before importing products.`);
  }
  return value;
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function embedProduct(model, product) {
  const text = [
    product.title,
    product.description,
    product.brand,
    product.category,
    ...(product.tags || []),
  ]
    .filter(Boolean)
    .join(' ');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      const delay = 1000 * attempt;
      console.warn(`Embedding attempt ${attempt} failed; retrying in ${delay / 1000}s.`);
      await sleep(delay);
    }
  }
}

async function main() {
  const weaviateUrl = requireEnvironment('WEAVIATE_URL');
  const weaviateApiKey = requireEnvironment('WEAVIATE_API_KEY');
  const geminiApiKey = requireEnvironment('GEMINI_API_KEY');
  const productsPath = path.join(__dirname, '../public/files/products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

  const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
    authCredentials: new weaviate.ApiKey(weaviateApiKey),
  });

  try {
    if (!(await client.collections.exists(COLLECTION_NAME))) {
      throw new Error(`Weaviate collection "${COLLECTION_NAME}" was not found.`);
    }

    const collection = client.collections.use(COLLECTION_NAME);
    const model = new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({
      model: 'gemini-embedding-001',
    });

    console.log(`Importing ${products.length} products into ${COLLECTION_NAME}...`);

    for (const [index, product] of products.entries()) {
      const id = weaviate.generateUuid5(`ecommerce-product-${product.id}`);
      const vector = await embedProduct(model, product);

      if (await collection.data.exists(id)) {
        await collection.data.update({
          id,
          properties: { data: JSON.stringify(product) },
          vectors: vector,
        });
      } else {
        await collection.data.insert({
          id,
          properties: { data: JSON.stringify(product) },
          vectors: vector,
        });
      }

      console.log(`[${index + 1}/${products.length}] ${product.title}`);
      await sleep(125);
    }

    console.log('Product import completed successfully.');
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error('Product import failed:', error.message);
  process.exitCode = 1;
});
