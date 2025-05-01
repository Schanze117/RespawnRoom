# Agora Voice/Video Chat Setup Guide

This guide will help you set up Agora voice and video chat for the Respawn Room application.

## Prerequisites

1. Create an Agora account at [https://www.agora.io/](https://www.agora.io/)
2. Create a new project in the Agora Console
3. Obtain your App ID and App Certificate

## Server Setup

### 1. Configure Environment Variables

Create or update your `.env` file in the server directory with your Agora credentials:

```
# Agora credentials
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
```

### 2. Verify Server Routes

The server should have an `/api/agora/token` endpoint that generates tokens for clients. 
Confirm that `server/src/routes/agoraRoutes.js` is included in your server setup.

## Testing Your Configuration

### Option 1: Use the Test Pages

We've included two HTML test pages to help debug Agora configuration:

1. `/client/public/agora-quicktest.html` - A simple test for App ID connectivity
2. `/client/public/agora-test.html` - A more comprehensive test for both direct and token-based authentication

Access these pages in your browser when the server is running:
- http://localhost:3000/agora-quicktest.html
- http://localhost:3000/agora-test.html

### Option 2: Check Server Logs

When starting the server, check for confirmation messages showing your Agora credentials are loaded:

```
Agora credentials check:
APP_ID: your_app_id_here
APP_CERTIFICATE: Length: 32
```

## Troubleshooting

### Common Errors

1. **"invalid vendor key"** or **"CAN_NOT_GET_GATEWAY_SERVER"**:
   - Verify your App ID in the `.env` file
   - Check that your project is active in the Agora Console
   - Ensure your account has sufficient credit/minutes

2. **"Token generation failed"**:
   - Verify your App Certificate in the `.env` file
   - Check server logs for detailed error messages

3. **Permission Issues**:
   - Users must grant camera and microphone permissions
   - Test in a secure context (HTTPS or localhost)

### Network Requirements

Agora requires the following domains to be accessible:
- *.agora.io
- *.agoraio.cn
- *.sd-rtn.com

If you're behind a firewall, make sure these domains are whitelisted.

## Voice Quality Optimization

For better voice quality, consider:

1. Enabling noise suppression and echo cancellation:
   ```javascript
   const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
     AEC: true,
     ANS: true,
     AGC: true
   });
   ```

2. Adjusting bitrate settings for different network conditions:
   ```javascript
   // For reliable quality on poor connections
   client.setLowStreamParameter({
     bitrate: 100,
     frameRate: 15,
     width: 320,
     height: 180
   });
   ```

## Production Considerations

For production deployments:
- Always use token-based authentication
- Set appropriate token expiration times
- Consider implementing channel encryption
- Monitor usage through the Agora Console

## Resources

- [Agora Web SDK Documentation](https://docs.agora.io/en/voice-calling/get-started/get-started-sdk?platform=web)
- [Agora Token Server Examples](https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraDynamicKey) 