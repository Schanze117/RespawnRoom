// const http = require('http');
// const https = require('https');
// const url = require('url');
// const { google } = require('googleapis');
// const crypto = require('crypto');
// const express = require('express');
// const session = require('express-session');

// /**
//  * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.
//  * To get these credentials for your application, visit
//  * https://console.cloud.google.com/apis/credentials.
//  */
// const oauth2Client = new google.auth.OAuth2(
//   YOUR_CLIENT_ID = ,
//   YOUR_CLIENT_SECRET,
//   YOUR_REDIRECT_URL
// );

// // Access scopes for two non-Sign-In scopes: Read-only Drive activity and Google Calendar.
// const scopes = [
//   'https://www.googleapis.com/auth/drive.metadata.readonly',
//   'https://www.googleapis.com/auth/calendar.readonly'
// ];

// /* Global variable that stores user credential in this code example.
//  * ACTION ITEM for developers:
//  *   Store user's refresh token in your data store if
//  *   incorporating this code into your real app.
//  *   For more information on handling refresh tokens,
//  *   see https://github.com/googleapis/google-api-nodejs-client#handling-refresh-tokens
//  */
// let userCredential = null;

// async function main() {
//   const app = express();

//   app.use(session({
//     secret: 'your_secure_secret_key', // Replace with a strong secret
//     resave: false,
//     saveUninitialized: false,
//   }));

//   // Example on redirecting user to Google's OAuth 2.0 server.
//   app.get('/', async (req, res) => {
//     // Generate a secure random state value.
//     const state = crypto.randomBytes(32).toString('hex');
//     // Store state in the session
//     req.session.state = state;

//     // Generate a url that asks permissions for the Drive activity and Google Calendar scope
//     const authorizationUrl = oauth2Client.generateAuthUrl({
//       // 'online' (default) or 'offline' (gets refresh_token)
//       access_type: 'offline',
//       /** Pass in the scopes array defined above.
//         * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
//       scope: scopes,
//       // Enable incremental authorization. Recommended as a best practice.
//       include_granted_scopes: true,
//       // Include the state parameter to reduce the risk of CSRF attacks.
//       state: state
//     });

//     res.redirect(authorizationUrl);
//   });

//   // Receive the callback from Google's OAuth 2.0 server.
//   app.get('/oauth2callback', async (req, res) => {
//     // Handle the OAuth 2.0 server response
//     let q = url.parse(req.url, true).query;

//     if (q.error) { // An error response e.g. error=access_denied
//       // Handle error
//     } else if (q.state !== req.session.state) { //check state value
//       res.end('State mismatch. Possible CSRF attack');
//     } else { // Get access and refresh tokens (if access_type is offline)
//       let { tokens } = await oauth2Client.getToken(q.code);
//       oauth2Client.setCredentials(tokens);

//       /** Save credential to the global variable in case access token was refreshed.
//         * ACTION ITEM: In a production app, you likely want to save the refresh token
//         *              in a secure persistent database instead. */
//       userCredential = tokens;
      
//       // User authorized the request. Now, check which scopes were granted.
//       if (tokens.scope.includes('https://www.googleapis.com/auth/drive.metadata.readonly'))
//       {
//         // User authorized read-only Drive activity permission.
//         // Example of using Google Drive API to list filenames in user's Drive.
//         const drive = google.drive('v3');
//         drive.files.list({
//           auth: oauth2Client,
//           pageSize: 10,
//           fields: 'nextPageToken, files(id, name)',
//         }, (err1, res1) => {
//           if (err1) return; // Handle error silently
//           const files = res1.data.files;
//           if (files.length) {
//             // Process files
//           } else {
//             // Handle no files case
//           }
//         });
//       }
//       else
//       {
//         // User didn't authorize read-only Drive activity permission.
//         // Update UX and application accordingly
//       }

//       // Check if user authorized Calendar read permission.
//       if (tokens.scope.includes('https://www.googleapis.com/auth/calendar.readonly'))
//       {
//         // User authorized Calendar read permission.
//         // Calling the APIs, etc.
//       }
//       else
//       {
//         // User didn't authorize Calendar read permission.
//         // Update UX and application accordingly
//       }
//     }
//   });

//   // Example on revoking a token
//   app.get('/revoke', async (req, res) => {
//     // Build the string for the POST request
//     let postData = "token=" + userCredential.access_token;

//     // Options for POST request to Google's OAuth 2.0 server to revoke a token
//     let postOptions = {
//       host: 'oauth2.googleapis.com',
//       port: '443',
//       path: '/revoke',
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'Content-Length': Buffer.byteLength(postData)
//       }
//     };

//     // Set up the request
//     const postReq = https.request(postOptions, function (res) {
//       res.setEncoding('utf8');
//       res.on('data', d => {
//         // Handle response silently
//       });
//     });

//     postReq.on('error', error => {
//       // Handle error silently
//     });

//     // Post the request with data
//     postReq.write(postData);
//     postReq.end();
//   });


//   const server = http.createServer(app);
//   server.listen(8080);
// }
// main().catch(() => {
//   // Handle error silently
// });