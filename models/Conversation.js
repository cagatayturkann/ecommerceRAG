const mongoose = require('mongoose');

// Messages are embedded in their conversation; the chat endpoint only reads the last few.
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema(
  {
    // Random 128-bit bearer token the client sends back to continue the conversation; _id is never exposed.
    token: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    messages: [messageSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Partial so that conversations created before tokens existed (no token, unreachable now) do not block the index.
conversationSchema.index({ token: 1 }, { unique: true, partialFilterExpression: { token: { $type: 'string' } } });

module.exports = mongoose.model('Conversation', conversationSchema);
