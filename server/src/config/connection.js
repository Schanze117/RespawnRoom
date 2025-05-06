import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';

// Setup __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));
// Configure dotenv to load from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// MongoDB connection string
const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Validate connection string format
if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
  console.error('Invalid MongoDB connection string format. Must start with mongodb:// or mongodb+srv://');
  process.exit(1);
}

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

db.once('open', () => {
  console.log('Successfully connected to MongoDB.');
});

export default db;
