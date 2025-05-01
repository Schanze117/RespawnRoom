import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Setup __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Try to load from root directory
dotenv.config();

console.log('\n--- Environment Variable Check ---');
console.log('Current working directory:', process.cwd());

// Check if .env file exists in various locations
const rootEnvPath = path.resolve(process.cwd(), '.env');
const serverEnvPath = path.resolve(__dirname, '.env');
const parentEnvPath = path.resolve(process.cwd(), '../.env');

console.log('\nChecking for .env files:');
console.log(`Root .env (${rootEnvPath}):`, fs.existsSync(rootEnvPath) ? 'EXISTS' : 'NOT FOUND');
console.log(`Server .env (${serverEnvPath}):`, fs.existsSync(serverEnvPath) ? 'EXISTS' : 'NOT FOUND');
console.log(`Parent .env (${parentEnvPath}):`, fs.existsSync(parentEnvPath) ? 'EXISTS' : 'NOT FOUND');

// Check environment variables
console.log('\nAgora Environment Variables:');
console.log('AGORA_APP_ID:', process.env.AGORA_APP_ID ? '✅ FOUND' : '❌ MISSING');
console.log('AGORA_APP_CERTIFICATE:', process.env.AGORA_APP_CERTIFICATE ? '✅ FOUND' : '❌ MISSING');

// If any of the required variables are missing, provide instructions
if (!process.env.AGORA_APP_ID || !process.env.AGORA_APP_CERTIFICATE) {
  console.log('\n⚠️ Some required environment variables are missing!');
  console.log('\nPlease ensure you have a .env file with the following variables:');
  console.log('AGORA_APP_ID=411338675');
  console.log('AGORA_APP_CERTIFICATE=cdc5bb9fde2e491d95fd6eb5d6a51941');
  console.log('\nYou can manually set them in your terminal:');
  console.log('- For Windows CMD: set AGORA_APP_ID=411338675');
  console.log('- For PowerShell: $env:AGORA_APP_ID="411338675"');
  console.log('- For Linux/Mac: export AGORA_APP_ID=411338675');
} else {
  console.log('\n✅ All required Agora environment variables are set correctly!');
}

console.log('\n--- End of Environment Check ---\n'); 