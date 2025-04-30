const forceDatabaseRefresh = false;

import express from 'express';
import sequelize from './config/connection.js';
import routes from './routes/index.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config();
// import cors from "cors";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;



// Serves static files in the entire client's dist folder
app.use(express.static('../client/dist'));
app.use(express.json());


// route for fetching IGDB API data
app.post("/api/games", async (req, res) => {
  const { content } = req.body;

  const API_BASE_URL = "https://api.igdb.com/v4"; 
  const token = process.env.VITE_ACCESS_TOKEN;
  const clientId = process.env.VITE_CLIENT_ID;

  const response = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`,
    },
    body: content,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  res.status(200).json(data);
});

app.post("/api/game_videos", async (req, res) => {
  const { content } = req.body;

  const API_BASE_URL = "https://api.igdb.com/v4"; 
  const token = process.env.VITE_ACCESS_TOKEN;
  const clientId = process.env.VITE_CLIENT_ID;

  console.log("Content:", content);

  const response = await fetch(`${API_BASE_URL}/game_videos`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`,
    },
    body: content,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  res.status(200).json(data);
});


app.use(routes);
app.get('*', (req
  , res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
}
);

sequelize.sync({force: forceDatabaseRefresh}).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});
