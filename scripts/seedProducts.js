// Loads public/files/products.json into Weaviate. Safe to re-run: object IDs are derived
// from product IDs, so existing products are replaced instead of duplicated.
require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const weaviate = require('weaviate-client');
const { COLLECTION_NAME, getClient } = require('../utils/weaviate');

const BATCH_SIZE = 50;

// Only these fields are embedded; the full record is stored as JSON in `data` for the prompt and the UI.
const toProperties = (product) => ({
  productId: product.id,
  title: product.title,
  description: product.description,
  brand: product.brand || '',
  category: product.category,
  tags: product.tags || [],
  data: JSON.stringify(product),
});

async function ensureCollection(client) {
  if (await client.collections.exists(COLLECTION_NAME)) return;

  const { configure, dataType } = weaviate;
  await client.collections.create({
    name: COLLECTION_NAME,
    vectorizers: configure.vectors.text2VecModel2Vec({
      sourceProperties: ['title', 'description', 'brand', 'category', 'tags'],
    }),
    properties: [
      { name: 'productId', dataType: dataType.INT },
      { name: 'title', dataType: dataType.TEXT },
      { name: 'description', dataType: dataType.TEXT },
      { name: 'brand', dataType: dataType.TEXT },
      { name: 'category', dataType: dataType.TEXT },
      { name: 'tags', dataType: dataType.TEXT_ARRAY },
      { name: 'data', dataType: dataType.TEXT, skipVectorization: true, indexSearchable: false },
    ],
  });
  console.log(`Created collection ${COLLECTION_NAME}.`);
}

async function main() {
  const productsPath = path.join(__dirname, '../public/files/products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

  const client = await getClient();
  try {
    await ensureCollection(client);
    const collection = client.collections.use(COLLECTION_NAME);

    for (let start = 0; start < products.length; start += BATCH_SIZE) {
      const batch = products.slice(start, start + BATCH_SIZE).map((product) => ({
        id: weaviate.generateUuid5(`product-${product.id}`),
        properties: toProperties(product),
      }));

      const result = await collection.data.insertMany(batch);
      if (result.hasErrors) {
        throw new Error(`Batch starting at ${start} failed: ${JSON.stringify(result.errors)}`);
      }
      console.log(`Upserted ${Math.min(start + BATCH_SIZE, products.length)}/${products.length} products.`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
});
