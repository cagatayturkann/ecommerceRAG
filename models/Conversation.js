const mongoose = require('mongoose');

// Message şeması - Conversation içinde gömülü olarak kullanılacak
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Conversation şeması
const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  messages: [messageSchema], // Mesajlar dizisi
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { versionKey: false }); // versionKey'i devre dışı bırak

// Bir mesaj eklendiğinde updatedAt alanını güncelle
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // İlk mesaj eklendiğinde title'ı güncelle
  if (this.isModified('messages') && this.messages.length > 0 && this.title === 'Yeni Konuşma') {
    // İlk kullanıcı mesajını title olarak kullan (maksimum 30 karakter)
    const userMessages = this.messages.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      const firstUserMessage = userMessages[0].content;
      this.title = firstUserMessage.length > 30 
        ? firstUserMessage.substring(0, 30) + '...' 
        : firstUserMessage;
    }
  }
  
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema); 