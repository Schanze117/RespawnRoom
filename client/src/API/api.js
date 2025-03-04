import { getValidToken } from "./authService.js";

const API_BASE_URL = "POST: https://id.twitch.tv/oauth2/token?client_id=4zg09ijwmpkhl2z3g5gx9ed3ehwjux&client_secret=3h5na9gwagbhrawpd69wf4k2n4uwb9&grant_type=client_credentials"; 
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
