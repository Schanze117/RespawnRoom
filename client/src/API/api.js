import { getValidToken } from "./authService.js";

const API_BASE_URL = "https://api.example.com"; // Replace with actual API URL

const fetchData = async (endpoint) => {
  const token = await getValidToken();
  if (!token) {
    throw new Error("No valid authentication token available.");
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
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
