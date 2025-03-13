# E-commerce RAG Application

This is an e-commerce application that uses Retrieval-Augmented Generation (RAG) to provide intelligent product search and recommendations.

## Project Structure

The project follows a modular architecture with clear separation of concerns:

### Controllers
- `chatController.js`: Handles chat processing logic
- `agentController.js`: Contains agent logic for translation, categorization, and classification
- `productController.js`: Handles product-related operations
- `conversationController.js`: Manages conversation state and history

### Services
- `vectorService.js`: Handles vector database operations (Weaviate)
- `aiService.js`: Manages AI model interactions (Gemini, OpenAI)
- `productService.js`: Provides product-related services
- `conversationService.js`: Manages conversation persistence and retrieval

### Routes
- `chatRoutes.js`: Routes for chat functionality
- `productRoutes.js`: Routes for product operations
- `conversationRoutes.js`: Routes for conversation management

### Utils
- `weaviate.js`: Utility for Weaviate vector database connection

### Config
- Database configuration and other settings

### Middlewares
- Authentication and other middleware functions

## API Endpoints

- `/api/chat`: Chat processing endpoint
- `/api/conversations`: Conversation management endpoints
- `/product`: Product detail endpoints

## Setup

1. Install dependencies:
```
npm install
```

2. Set up environment variables in `.env` file:
```
PORT=3000
MONGODB_URI=your_mongodb_uri
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_weaviate_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

3. Run the application:
```
npm start
```

## Architecture Notes

The application follows a clean architecture pattern with:
- Clear separation of concerns
- Service-oriented design
- Modular components
- Dependency injection

This structure makes the codebase more maintainable, testable, and scalable. 