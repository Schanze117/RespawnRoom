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

if (isDevelopment) {
  console.log('🔧 IGDB CONFIG DEBUG: Environment loaded');
  console.log('🔧 IGDB CONFIG DEBUG: NODE_ENV =', process.env.NODE_ENV);
  console.log('🔧 IGDB CONFIG DEBUG: IGDB_CLIENT_ID available =', !!process.env.IGDB_CLIENT_ID);
  console.log('🔧 IGDB CONFIG DEBUG: IGDB_ACCESS_TOKEN available =', !!process.env.IGDB_ACCESS_TOKEN);
  
  if (process.env.IGDB_CLIENT_ID) {
    console.log('🔧 IGDB CONFIG DEBUG: IGDB_CLIENT_ID length =', process.env.IGDB_CLIENT_ID.length);
  }
  
  if (process.env.IGDB_ACCESS_TOKEN) {
    console.log('🔧 IGDB CONFIG DEBUG: IGDB_ACCESS_TOKEN length =', process.env.IGDB_ACCESS_TOKEN.length);
    console.log('🔧 IGDB CONFIG DEBUG: IGDB_ACCESS_TOKEN starts with =', process.env.IGDB_ACCESS_TOKEN.substring(0, 10) + '...');
  }
}

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

// Add request interceptor for logging
igdbAPI.interceptors.request.use(
  config => {
    if (isDevelopment) {
      console.log('🔧 IGDB REQUEST DEBUG:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        headers: {
          'Client-ID': config.headers['Client-ID'] ? `${config.headers['Client-ID'].substring(0, 8)}...` : 'MISSING',
          'Authorization': config.headers['Authorization'] ? `${config.headers['Authorization'].substring(0, 15)}...` : 'MISSING',
          'Content-Type': config.headers['Content-Type']
        },
        data: config.data ? config.data.substring(0, 100) + '...' : 'No data'
      });
    }
    return config;
  },
  error => {
    if (isDevelopment) {
      console.error('🔧 IGDB REQUEST ERROR:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and logging
igdbAPI.interceptors.response.use(
  response => {
    if (isDevelopment) {
      console.log('🔧 IGDB RESPONSE DEBUG:', {
        status: response.status,
        statusText: response.statusText,
        dataLength: response.data ? response.data.length : 0,
        headers: response.headers
      });
    }
    return response;
  },
  error => {
    if (isDevelopment) {
      console.error('🔧 IGDB RESPONSE ERROR:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    }
    return Promise.reject(error);
  }
);

// Export a function to fetch game data from IGDB API
export const fetchGameData = async (query) => {
  if (isDevelopment) {
    console.log('🔧 IGDB FETCH DEBUG: Attempting to fetch with query:', query.substring(0, 100) + '...');
  }
  
  try {
    const response = await igdbAPI.post('', query);
    
    if (isDevelopment) {
      console.log('🔧 IGDB FETCH SUCCESS: Retrieved', response.data?.length || 0, 'games');
    }
    
    return response.data;
  } catch (error) {
    if (isDevelopment) {
      console.error('🔧 IGDB FETCH ERROR:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    throw error;
  }
}; 