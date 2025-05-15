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
    console.log('Auth check - Token exists:', !!token, token ? token.substring(0, 20) + '...' : '');
    
    if (!token) {
      return false;
    }
    
    try {
      // Try to decode the token - will throw if invalid
      const decoded = jwtDecode(token);
      
      // Check if token is expired
      const isExpired = decoded?.exp && decoded?.exp < Date.now() / 1000;
      console.log('Auth check - Token expired:', isExpired);
      
      if (isExpired) {
        localStorage.removeItem('jwtToken');
        return false;
      }
      
      return true;
    } catch (err) {
      // If token is invalid or can't be decoded
      console.error('Invalid token:', err);
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
      console.error('Error checking token expiration:', err);
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
      console.error('No token provided for login');
      return;
    }
    
    try {
      console.log('Processing login token...');
      
      // Attempt to decode the token to verify it's valid
      const decoded = jwtDecode(idToken);
      
      console.log('Token decoded successfully, payload:', {
        id: decoded._id,
        username: decoded.userName,
        email: decoded.email,
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'none'
      });
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        console.error('Token is expired');
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
        console.log('Token saved to localStorage. Key: jwtToken, Value length:', idToken.length);
        
        // Verify it was saved
        const savedToken = localStorage.getItem('jwtToken');
        console.log('Verification - Token retrieved from localStorage exists:', !!savedToken, 
                    savedToken ? savedToken.substring(0, 20) + '...' : '');
      } catch (storageErr) {
        console.error('Error saving token to localStorage:', storageErr);
      }
      
      // Check if there's a saved redirect URL in sessionStorage
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      console.log('Redirecting after login to:', redirectUrl);
      
      // Clear the saved redirect URL
      sessionStorage.removeItem('redirectUrl');
      
      // Redirect to the saved URL or home page
      window.location.assign(redirectUrl);
    } catch (err) {
      console.error('Invalid token provided:', err);
      console.error('Token was:', idToken.substring(0, 20) + '...');
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
