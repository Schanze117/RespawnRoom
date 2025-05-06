import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the IGDB credentials from environment variables
// Don't use VITE_ prefix for server-side variables
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID || process.env.VITE_CLIENT_ID;
const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || process.env.VITE_ACCESS_TOKEN;

// Configure the axios instance for IGDB API
export const igdbAPI = axios.create({
  baseURL: 'https://api.igdb.com/v4/games',
  headers: {
    'Client-ID': IGDB_CLIENT_ID,
    'Authorization': `Bearer ${IGDB_ACCESS_TOKEN}`,
    'Content-Type': 'text/plain'
  },
  timeout: 10000, // 10 second timeout for requests
  validateStatus: (status) => {
    return status >= 200 && status < 500; // Only throw for server errors
  }
});

// Add response interceptor for error handling
igdbAPI.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    return Promise.reject(error);
  }
);

// Export a function to fetch game data from IGDB API
export const fetchGameData = async (query) => {
  try {
    const response = await igdbAPI.post('', query);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 