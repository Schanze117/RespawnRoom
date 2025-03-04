import { clearToken } from "./authService.js";

const logout = () => {
  clearToken();
  window.location.reload(); // Reload to reflect logout state
};

document.getElementById("logoutBtn").addEventListener("click", logout);
