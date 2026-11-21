const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log(`MongoDB connected: ${conn.connection.host}`);

  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected; the driver will retry.'));
};

module.exports = connectDB;
