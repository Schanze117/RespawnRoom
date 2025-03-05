import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = "https://api.igdb.com/v4"; 

const searchGames = async (game) => {
  try {
    const token = process.env.ACCESS_TOKEN;
    const clientId = process.env.CLIENT_ID;

    if (!token) {
      throw new Error("No valid authentication token available.");
    }
    
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: "POST",
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(`search "${game}"; fields name, cover.url, summary, genres.name, player_perspectives.name; limit 10;`),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("Error fetching game data:", error);
    throw error;
  }
};

export { searchGames };