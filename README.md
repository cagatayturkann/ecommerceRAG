# E-commerce RAG Application

An intelligent e-commerce application that leverages Retrieval-Augmented Generation (RAG) to provide advanced product search, recommendations, and conversational commerce capabilities.

## Features

* **RAG (Retrieval Augmented Generation)**: Produces knowledge-based responses using vector database technology
* **Weaviate Vector Database**: Semantic search integration for intelligent product retrieval
* **Gemini API Integration**: Uses Google's Gemini AI model for powerful, context-aware responses
* **Conversation History**: Stores all customer conversations in MongoDB for personalized experiences
* **Multi-language Support**: Ability to handle queries in different languages via integrated translation
* **Web Widget**: Ready-to-use chatbot widget for easy integration into any e-commerce site
* **Product Detail Pages**: Dynamic product detail pages with complete information
* **Security**: CORS protection and origin/referrer control for secure deployment

## Getting Started

### Requirements

* Node.js 14.x or higher
* MongoDB
* Weaviate account and collection
* Gemini API key (or OpenAI/OpenRouter API key)

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/ecommerceRAG.git
cd ecommerceRAG
```

2. Install dependencies:
```
npm install
```

3. Configure the `.env` file:
```
PORT=3000
MONGODB_URI=your_mongodb_uri
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_weaviate_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

4. Make sure MongoDB is running

5. Start the application:
```
npm start
```

## Project Structure

```
ecommerceRAG/
├── controllers/     # Request handlers
│   ├── chatController.js
│   ├── agentController.js
│   ├── productController.js
│   └── conversationController.js
├── services/        # Business logic services
│   ├── vectorService.js
│   ├── aiService.js
│   ├── productService.js
│   └── conversationService.js
├── routes/          # API routes
│   ├── chatRoutes.js
│   ├── productRoutes.js
│   └── conversationRoutes.js
├── utils/           # Utility functions
├── config/          # Configuration files
├── middlewares/     # Middleware functions
├── models/          # Database models
├── public/          # Static files (HTML, CSS, JS)
├── research/        # Research and data files
├── .env             # Environment variables
└── server.js        # Main application file
```

## API Reference

### Chat API

* **POST /api/chat**  
  * Sends a new message and receives an AI response  
  * Request body: `{ "message": "string", "conversationId": "string" (optional) }`  
  * Response: `{ "response": "string", "conversationId": "string" }`

### Conversation API

* **GET /api/conversations**  
  * Lists all conversations  
  * Response: `[{ "_id": "string", "title": "string", "createdAt": "date" }]`
* **GET /api/conversations/:id**  
  * Gets details of a specific conversation  
  * Response: `{ "_id": "string", "title": "string", "messages": [{ "role": "string", "content": "string", "timestamp": "date" }] }`
* **DELETE /api/conversations/:id**  
  * Deletes a conversation  
  * Response: `{ "success": true }`

### Product API

* **GET /product/:id**
  * Gets a product detail page
  * Response: HTML product detail page

## Widget Integration

You can integrate the chatbot into your e-commerce website by adding the widget code:

```html
<!-- ChaCha Chatbot Widget -->
<script src="https://your-domain.com/js/widget.js"></script>
```

## Vector Database

This project uses Weaviate vector database for semantic search. For setup:

1. Create a Weaviate account
2. Create a collection named "Products"
3. Add product data with this structure: `{ "id": "string", "title": "string", "description": "string", "price": number, ... }`

## Architecture Notes

The application follows a clean architecture pattern with:
- Clear separation of concerns
- Service-oriented design
- Modular components
- Dependency injection

This structure makes the codebase more maintainable, testable, and scalable.

## Development

### Services Description

* **aiService**: Interacts with Gemini/OpenAI API and generates AI responses
* **vectorService**: Creates vector embeddings and retrieves information from Weaviate
* **conversationService**: Manages conversations (creation, updating, deletion)
* **productService**: Handles product-related operations and formatting

### Controllers Description

* **chatController**: Processes user messages and returns AI responses
* **conversationController**: Performs conversation management operations
* **agentController**: Provides auxiliary functions such as translation
* **productController**: Manages product detail pages and product operations

## Contributing

1. Fork this repo
2. Create a new branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push your branch: `git push origin feature/amazing-feature`
5. Open a Pull Request 