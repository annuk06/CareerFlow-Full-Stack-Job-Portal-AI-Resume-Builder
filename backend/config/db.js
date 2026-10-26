const mongoose = require('mongoose');
const { FallbackModel } = require('./fallbackDb');

let useFallback = false;

async function connectDB() {
  const fallbackEnv = process.env.DB_FALLBACK || 'auto';
  
  if (fallbackEnv === 'true') {
    useFallback = true;
    console.log('⚠️ Database Mode: Local JSON File Fallback (Forced via DB_FALLBACK=true)');
    return;
  }
  
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerflow';
  
  try {
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    console.log('✅ Database Mode: Connected to MongoDB.');
    useFallback = false;
  } catch (error) {
    if (fallbackEnv === 'auto') {
      useFallback = true;
      console.log('⚠️ Database Mode: MongoDB connection failed. Falling back to Local JSON Files.');
    } else {
      console.error('❌ MongoDB Connection Error:', error.message);
      process.exit(1);
    }
  }
}

function getModel(modelName, schemaFields) {
  let mongooseModel;
  let schema;
  try {
    schema = new mongoose.Schema(schemaFields, { timestamps: true });
    mongooseModel = mongoose.model(modelName, schema);
  } catch (e) {
    try {
      mongooseModel = mongoose.model(modelName);
    } catch (err) {
      console.error(`Failed to register mongoose model ${modelName}:`, err);
    }
  }
  
  const fallbackModel = new FallbackModel(modelName);
  
  // Return Proxy to dynamically select database mode at execution time
  return new Proxy(function() {}, {
    // Construct handler for 'new Model(data)'
    construct(target, args) {
      const data = args[0] || {};
      if (useFallback) {
        const { FallbackDocument } = require('./fallbackDb');
        return new FallbackDocument(data, fallbackModel);
      } else {
        return new mongooseModel(data);
      }
    },
    // Get handler for static methods like 'Model.find()'
    get(target, prop) {
      if (prop === 'isFallback') {
        return useFallback;
      }
      if (prop === 'mongooseModel') {
        return mongooseModel;
      }
      if (prop === 'fallbackModel') {
        return fallbackModel;
      }
      
      const activeModel = useFallback ? fallbackModel : mongooseModel;
      if (!activeModel) {
        throw new Error(`Model ${modelName} is not initialized.`);
      }
      const val = activeModel[prop];
      if (typeof val === 'function') {
        return val.bind(activeModel);
      }
      return val;
    }
  });
}

module.exports = {
  connectDB,
  getModel,
  isFallback: () => useFallback
};
