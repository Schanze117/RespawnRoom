import {jwtDecode} from 'jwt-decode';

class AuthService {
  getProfile() {
    // decodes the token 
    // This function takes the token obtained from getToken() and decodes it to extract the user profile information.
    try {
      return jwtDecode(this.getToken());
    } catch (err) {
      console.error('Error decoding token:', err);
      return {};
    }
  }

  loggedIn() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token) {
    try {
      // Attempt to decode the token using jwtDecode.
      const decoded = jwtDecode(token);

      // Check if the token has an expiration time (exp) and if it is less than the current time.
      if (decoded?.exp && decoded?.exp < Date.now() / 1000) {
        // If the token is expired, return true indicating that it is expired.
        return true;
      }
      return false;
    } catch (err) {
      // If there is an error during decoding, log the error and return false.
      console.error('Error checking token expiration:', err);
      return true; // Consider invalid tokens as expired
    }
  }

  getToken() {
    const loggedUser = localStorage.getItem('jwtToken') || '';
    return loggedUser;
  }

  getUserId() {
    try {
      const profile = this.getProfile();
      return profile?.id || null;
    } catch (err) {
      return null;
    }
  }

  login(idToken) {
    if (!idToken) {
      console.error('No token provided for login');
      return;
    }
    
    // Store the token in localStorage
    localStorage.setItem('jwtToken', idToken);
    
    // Redirect to home page
    window.location.assign('/');
  }

  logout() {
    // Remove the token from localStorage
    localStorage.removeItem('jwtToken');
    
    // Redirect to login page
    window.location.assign('/login');
  }
}

export default new AuthService();
