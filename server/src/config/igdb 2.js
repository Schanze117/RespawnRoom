import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Ensure env is loaded from project root, not server/ cwd
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  dotenv.config({ path: resolve(__dirname, '../../.env') });
} catch {}

// Development mode logging
const isDevelopment = process.env.NODE_ENV === 'development';

// Build axios instance with headers from current env
export const igdbAPI = axios.create({
  baseURL: 'https://api.igdb.com/v4/games',
  headers: {
    'Client-ID': process.env.IGDB_CLIENT_ID,
    'Authorization': `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
    'Content-Type': 'text/plain'
  },
  timeout: 10000,
  validateStatus: (status) => status >= 200 && status < 500
});

//

// Add response interceptor for error handling and logging
igdbAPI.interceptors.response.use(r => r, e => Promise.reject(e));

// Export a function to fetch game data from IGDB API
export const fetchGameData = async (query) => {
  const response = await igdbAPI.post('', query);
  return response.data;
};