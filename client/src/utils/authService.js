const TOKEN_STORAGE_KEY = "authToken";

/**
 * Fetch a new access token from the authentication API.
 * (Replace with actual API call)
 */
const fetchAuthToken = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newToken = {
        access_token: "msygblsxj6hqdoobbw1a8oea7864yb",
        expires_in: 3600, // Token expires in 1 hour
        token_type: "bearer",
        created_at: Date.now(),
      };
      resolve(newToken);
    }, 1000); // Simulate API delay
  });
};

/**
 * Store the token securely in localStorage.
 */
const saveToken = (token) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
};

/**
 * Retrieve the token from localStorage.
 */
const getToken = () => {
  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!storedToken) return null;

  const token = JSON.parse(storedToken);
  const currentTime = Date.now();
  const expirationTime = token.created_at + token.expires_in * 1000; // Convert seconds to milliseconds

  // Check if token is expired
  if (currentTime >= expirationTime) {
    console.warn("Token expired, clearing...");
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }

  return token;
};

/**
 * Get a valid token, either from storage or fetch a new one.
 */
const getValidToken = async () => {
  let token = getToken();

  if (!token) {
    console.log("Fetching new token...");
    token = await fetchAuthToken();
    saveToken(token);
  }

  return token.access_token;
};

/**
 * Clear the token (Logout functionality).
 */
const clearToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  console.log("Token cleared.");
};

export { getValidToken, clearToken };
