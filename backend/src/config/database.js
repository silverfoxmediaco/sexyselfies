const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
  }

  async connect() {
    if (this.isConnected) {
      console.log('📊 Using existing database connection');
      return;
    }

    try {
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4 // Force IPv4
      };

      await mongoose.connect(process.env.MONGODB_URI, options);
      
      this.isConnected = true;
      this.connectionRetries = 0;
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      
      // Set up connection event handlers
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      await this.handleConnectionError(error);
    }
  }

  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      console.log('📊 MongoDB connected');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📊 MongoDB disconnected');
      this.isConnected = false;
      this.reconnect();
    });

    // Handle application termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  async handleConnectionError(error) {
    this.connectionRetries++;
    
    if (this.connectionRetries >= this.maxRetries) {
      console.error('❌ Max connection retries reached. Exiting...');
      process.exit(1);
    }
    
    console.log(`⏳ Retrying connection in ${this.retryDelay / 1000} seconds... (Attempt ${this.connectionRetries}/${this.maxRetries})`);
    
    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
    await this.connect();
  }

  async reconnect() {
    if (!this.isConnected) {
      console.log('🔄 Attempting to reconnect to MongoDB...');
      await this.connect();
    }
  }

  async gracefulShutdown() {
    console.log('👋 Gracefully shutting down MongoDB connection...');
    await mongoose.connection.close();
    process.exit(0);
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      readyStateText: this.getReadyStateText(mongoose.connection.readyState),
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }

  getReadyStateText(state) {
    switch(state) {
      case 0: return 'disconnected';
      case 1: return 'connected';
      case 2: return 'connecting';
      case 3: return 'disconnecting';
      default: return 'unknown';
    }
  }
}

// Create singleton instance
const database = new DatabaseConnection();

module.exports = database;