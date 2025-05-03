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
      // Decode the token using jwtDecode
      const decoded = jwtDecode(token);

      // Check if the token has an expiration time and if it is less than the current time
      if (decoded?.exp && decoded?.exp < Date.now() / 1000) {
        // If the token is expired, remove it from storage
        localStorage.removeItem('jwtToken');
        return true;
      }
      return false;
    } catch (err) {
      // If there is an error during decoding, log the error and remove the token
      console.error('Error checking token expiration:', err);
      localStorage.removeItem('jwtToken');
      return true; // Consider invalid tokens as expired
    }
  }

  getToken() {
    return localStorage.getItem('jwtToken') || '';
  }

  getUserId() {
    try {
      const profile = this.getProfile();
      return profile?._id || null;
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
    
    // Force a page reload to update all components
    window.location.assign('/');
  }

  logout() {
    // Remove the token from localStorage
    localStorage.removeItem('jwtToken');
    
    // Redirect to login page
    window.location.assign('/login');
  }
}

// Create an instance of the auth service
const Auth = new AuthService();
export default Auth;
