import {jwtDecode} from 'jwt-decode';

class AuthService {
  getProfile() {
    // decodes the token 
    // This function takes the token obtained from getToken() and decodes it to extract the user profile information.
    try {
      return jwtDecode(this.getToken());
    } catch (err) {
      return {};
    }
  }

  loggedIn() {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }
    
    try {
      // Try to decode the token - will throw if invalid
      const decoded = jwtDecode(token);
      
      // Check if token is expired
      const isExpired = decoded?.exp && decoded?.exp < Date.now() / 1000;
      
      if (isExpired) {
        localStorage.removeItem('jwtToken');
        return false;
      }
      
      return true;
    } catch (err) {
      // If token is invalid or can't be decoded
      localStorage.removeItem('jwtToken');
      return false;
    }
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
      localStorage.removeItem('jwtToken');
      return true; // Consider invalid tokens as expired
    }
  }

  getToken() {
    const token = localStorage.getItem('jwtToken') || '';
    return token;
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
      return;
    }
    
    try {
      
      // Attempt to decode the token to verify it's valid
      const decoded = jwtDecode(idToken);
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        // Redirect to login page with error parameter
        window.location.assign('/login?error=expired_token');
        return;
      }
      
      // First clear out any existing tokens
      localStorage.removeItem('jwtToken');
      
      // Store the valid token in localStorage with direct method
      try {
        // Use direct setting first
        localStorage.setItem('jwtToken', idToken);
        
        // Verify it was saved
        const savedToken = localStorage.getItem('jwtToken');
      } catch (storageErr) {
      }
      
      // Check if there's a saved redirect URL in sessionStorage
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      
      // Clear the saved redirect URL
      sessionStorage.removeItem('redirectUrl');
      
      // Redirect to the saved URL or home page
      window.location.assign(redirectUrl);
    } catch (err) {
      // Redirect to login page with error parameter
      window.location.assign('/login?error=invalid_token');
    }
  }

  logout() {
    // Remove the token from localStorage
    localStorage.removeItem('jwtToken');
    
    // Clear any saved redirect URLs to prevent redirect loops
    sessionStorage.removeItem('redirectUrl');
    
    // Redirect to login page with parameter indicating user just logged out
    window.location.assign('/login?just_logged_out=true');
  }
}

// Create an instance of the auth service
const Auth = new AuthService();
export default Auth;
