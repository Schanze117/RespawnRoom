import { getValidToken } from "./authService.js";
import dotenv from "dotenv";
dotenv.config();

const API_BASE_URL = "POST: https://api.igdb.com/v4"; 

const fetchData = async (games) => {
  const token = await process.env.ACCESS_TOKEN
  if (!token) {
    throw new Error("No valid authentication token available.");
  }

  const response = await fetch(`${API_BASE_URL}/${games}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

// Example Usage
fetchData("user/profile")
  .then((data) => console.log("User Data:", data))
  .catch((err) => console.error(err));
