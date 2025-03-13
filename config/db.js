const mongoose = require('mongoose');

// MongoDB bağlantı fonksiyonu
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 saniye bağlantı zaman aşımı
      socketTimeoutMS: 45000, // 45 saniye soket zaman aşımı
      connectTimeoutMS: 10000, // 10 saniye bağlantı zaman aşımı
      // Yeniden bağlanma ayarları
      family: 4, // IPv4 kullan
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Bağlantı hatalarını dinle
    mongoose.connection.on('error', err => {
      console.error('MongoDB bağlantı hatası:', err);
    });
    
    // Bağlantı kesildiğinde
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB bağlantısı kesildi, yeniden bağlanmaya çalışılıyor...');
    });
    
  } catch (error) {
    console.error(`MongoDB Bağlantı Hatası: ${error.message}`);
    // Kritik hatalarda uygulamayı sonlandırmak yerine hata döndür
    // process.exit(1); - Bu satırı kaldırdık
    throw error;
  }
};

module.exports = connectDB; 