import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the IGDB credentials from environment variables
// Don't use VITE_ prefix for server-side variables
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID || process.env.VITE_CLIENT_ID;
const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || process.env.VITE_ACCESS_TOKEN;

// Log IGDB configuration (without revealing full tokens)
console.log('IGDB Configuration:');
console.log('Client ID available:', !!IGDB_CLIENT_ID);
console.log('Access Token available:', !!IGDB_ACCESS_TOKEN);
console.log('Client ID:', IGDB_CLIENT_ID ? IGDB_CLIENT_ID.substring(0, 5) + '...' : 'Not available');
console.log('Access Token:', IGDB_ACCESS_TOKEN ? IGDB_ACCESS_TOKEN.substring(0, 5) + '...' : 'Not available');

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

// Add response interceptor for logging
igdbAPI.interceptors.response.use(
  response => {
    // Log successful responses but not the full data
    console.log(`IGDB API response: ${response.status} ${response.statusText}`);
    console.log(`Received ${response.data?.length || 0} items`);
    return response;
  },
  error => {
    // Enhanced error logging
    console.error('IGDB API error:', error.response ? error.response.status : error.message);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers: ${JSON.stringify(error.response.headers)}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    console.error('Error config:', error.config);
    
    return Promise.reject(error);
  }
);

// Export a function to fetch game data from IGDB API
export const fetchGameData = async (query) => {
  try {
    const response = await igdbAPI.post('', query);
    return response.data;
  } catch (error) {
    console.error('Error fetching game data from IGDB:', error);
    throw error;
  }
}; 