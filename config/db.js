const mongoose = require('mongoose');

// MongoDB bağlantı fonksiyonu
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Bağlantı Hatası: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 