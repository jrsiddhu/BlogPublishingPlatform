const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blog_publishing_platform';
  
  try {
    // Attempt Mongoose connection with 3000ms server selection timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`\x1b[32m✔ MongoDB Connected Successfully: ${mongoose.connection.host}/${mongoose.connection.name}\x1b[0m`);
    return true;
  } catch (err) {
    isConnected = false;
    console.warn(`\x1b[33m▲ Notice: Local MongoDB connection to "${uri}" was not detected (${err.message}).\x1b[0m`);
    console.log(`\x1b[36m⚡ Running in seamless Local JSON Store mode. Everything will work out-of-the-box!\x1b[0m`);
    console.log(`\x1b[90m(To use MongoDB, start your local mongod service or set MONGODB_URI in your .env file)\x1b[0m\n`);
    return false;
  }
};

const isMongoConnected = () => isConnected;

module.exports = {
  connectDB,
  isMongoConnected
};
