import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Hardcoded values for testing - these will be overridden from .env
const APP_ID = process.env.AGORA_APP_ID || '411338675';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'cdc5bb9fde2e491d95fd6eb5d6a51941';

// Test channel and user ID
const channelName = 'test-channel';
const uid = 12345;

console.log('\n--- Agora Token Test ---');
console.log('Testing token generation with:');
console.log(`App ID: ${APP_ID}`);
console.log(`App Certificate: ${APP_CERTIFICATE.substring(0, 5)}...${APP_CERTIFICATE.substring(APP_CERTIFICATE.length - 5)}`);
console.log(`Channel Name: ${channelName}`);
console.log(`User ID: ${uid}`);

try {
  // Configure token parameters
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  
  // Generate the token
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
  
  console.log('\n✅ Token generation successful!');
  console.log(`Generated Token: ${token.substring(0, 20)}...${token.substring(token.length - 20)}`);
  console.log(`Token Length: ${token.length} characters`);
  
  // Generate a second token to verify consistency
  const token2 = RtcTokenBuilder.buildTokenWithUid(
    APP_ID, 
    APP_CERTIFICATE,
    channelName,
    uid + 1, // different uid
    role,
    privilegeExpiredTs
  );
  
  console.log('\nSecond token (different uid) generated successfully');
  console.log(`Different User (${uid + 1}): ${token2.substring(0, 10)}...`);
  
  // Confirm tokens are different (as they should be for different uids)
  console.log(`\nTokens are ${token === token2 ? 'identical (ERROR)' : 'different (correct)'}`);
  
  console.log('\n--- End of Token Test ---');
} catch (error) {
  console.error('\n❌ Token generation failed:');
  console.error(error);
  console.error('\nPossible issues:');
  console.error('- Incorrect APP_ID or APP_CERTIFICATE format');
  console.error('- Issue with agora-token package');
  console.error('- Environment variables not properly loaded');
} 