# E-commerce RAG chatbot

A shopping assistant for an online store. Shoppers ask questions in any language through an embeddable chat widget; the server finds the relevant products with vector search and has Claude answer from those products only. Each answer lists the IDs of the products it was based on, and the widget shows cards for exactly those products.

It is a public, simplified version of retrieval work I did on a Shopify sales chatbot. The catalogue is 194 sample products from [DummyJSON](https://dummyjson.com/docs/products).

## Architecture

```
widget (public/js/widget.js)
  -> POST /api/chat (Express)
       1. Claude Haiku rewrites the message into an English search query (resolves follow-ups)
       2. Weaviate nearText search, embeddings from a local Model2Vec model -> top 3 products
       3. Claude Opus answers from those products and returns {answer, product_ids}
       4. Server keeps only IDs that were retrieved, renders escaped HTML + product cards
  -> MongoDB stores the conversation (last 4 messages are sent back as context)
```

- `controllers/chatController.js`: request validation and the pipeline above
- `services/aiService.js`: the two Claude calls (structured JSON output)
- `services/vectorService.js`, `utils/weaviate.js`: Weaviate search and client
- `scripts/seedProducts.js`: creates the collection and loads `public/files/products.json`
- `services/conversationService.js`, `models/Conversation.js`: conversation history in MongoDB

## Run it locally

Requirements: Node.js 20+, Docker, a MongoDB instance, and a Claude API key.

```bash
git clone https://github.com/cagatayturkann/ecommerceRAG.git
cd ecommerceRAG
npm install
cp .env.example .env        # set ANTHROPIC_API_KEY and MONGODB_URI
docker compose up -d        # Weaviate + Model2Vec on 127.0.0.1:8090 / 50061
npm run seed                # embeds and loads the 194 products (safe to re-run)
npm start                   # http://localhost:3000
```

Open http://localhost:3000 and use the chat button, or call the API directly:

```bash
curl -s localhost:3000/api/chat -H 'content-type: application/json' \
  -d '{"message": "Do you have a laptop for work?"}'
```

The response contains `answer` (plain text), `productIds` (the products the answer used), `conversationId` (send it back to continue the conversation) and `response` (the HTML the widget shows).

## Design notes

- **Retrieval.** Products are embedded once at seed time from their title, description, brand, category and tags with `minishlab/potion-retrieval-32M` (Model2Vec, runs on CPU in the Weaviate stack, no embedding API key). At query time Weaviate embeds the search query with the same model and returns the three nearest products.
- **Query rewriting.** The embedding model is English, and follow-ups such as "which one is cheaper?" do not name a product. A small Claude call turns the latest message plus the recent history into a short English query, or into an empty query when no product lookup is needed (greetings, general questions), in which case retrieval is skipped.
- **Grounding.** The answer prompt contains only the retrieved products (selected fields, no reviewer data) and tells the model to use only those facts. The model returns JSON with `answer` and `product_ids` (structured output). The server drops any ID that was not retrieved, so a product card can only come from the search results.
- **Safety of the rendered output.** The model's text and all product fields are HTML-escaped on the server before the widget inserts them.
- **Abuse limits.** `/api/chat` validates input (message up to 500 characters, conversation ID format), limits the JSON body to 10 KB and rate-limits each IP (20 requests per minute by default, in memory). In production, CORS and an Origin/Referer check accept only `ALLOWED_ORIGINS`; that check stops casual cross-site use, not a determined non-browser client.

## Limitations

- No automated tests yet.
- The rate limiter is in-process; several instances would need a shared store.
- The conversation ID returned to the client is a random 128-bit bearer token, not the database ID. Conversations still have no owner account, so whoever holds the token can continue that conversation. There is no endpoint that lists or reads conversations.
- Retrieval is pure vector search with a fixed top 3; there is no keyword or hybrid ranking and no relevance threshold.
