import { clearToken } from "./authService.js";

// Logout functionality
const logout = () => {
  clearToken();
  window.location.reload(); // Reload to reflect logout state
};

document.getElementById("logoutBtn").addEventListener("click", logout);
