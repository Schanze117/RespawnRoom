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
    console.log('🔍 AUTH DEBUG: loggedIn() function called');
    
    const token = this.getToken();
    console.log('🔍 AUTH DEBUG: Token from localStorage, length:', token ? token.length : 'NO TOKEN');
    
    if (!token) {
      console.log('🔍 AUTH DEBUG: No token found, returning false');
      return false;
    }
    
    try {
      console.log('🔍 AUTH DEBUG: Attempting to decode token for validation...');
      
      // Try to decode the token - will throw if invalid
      const decoded = jwtDecode(token);
      console.log('🔍 AUTH DEBUG: Token decoded successfully:', { 
        userId: decoded._id, 
        username: decoded.userName, 
        email: decoded.email,
        exp: decoded.exp 
      });
      
      // Check if token is expired
      const isExpired = decoded?.exp && decoded?.exp < Date.now() / 1000;
      console.log('🔍 AUTH DEBUG: Token expired check:', { 
        currentTime: Math.floor(Date.now() / 1000), 
        tokenExp: decoded?.exp, 
        isExpired 
      });
      
      if (isExpired) {
        console.log('🔍 AUTH DEBUG: Token is expired, removing from localStorage and returning false');
        localStorage.removeItem('jwtToken');
        return false;
      }
      
      console.log('🔍 AUTH DEBUG: Token is valid, returning true');
      return true;
    } catch (err) {
      console.error('🔍 AUTH ERROR: Failed to decode token:', err);
      // If token is invalid or can't be decoded
      localStorage.removeItem('jwtToken');
      console.log('🔍 AUTH DEBUG: Invalid token removed, returning false');
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
    console.log('🔍 AUTH DEBUG: Login function called with token length:', idToken ? idToken.length : 'NO TOKEN');
    
    if (!idToken) {
      console.error('🔍 AUTH ERROR: No token provided to login function');
      return;
    }
    
    try {
      console.log('🔍 AUTH DEBUG: Attempting to decode token...');
      
      // Attempt to decode the token to verify it's valid
      const decoded = jwtDecode(idToken);
      console.log('🔍 AUTH DEBUG: Token decoded successfully:', { 
        userId: decoded._id, 
        username: decoded.userName, 
        email: decoded.email,
        exp: decoded.exp 
      });
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        console.error('🔍 AUTH ERROR: Token is expired');
        // Redirect to login page with error parameter
        window.location.assign('/login?error=expired_token');
        return;
      }
      
      console.log('🔍 AUTH DEBUG: Token is valid, clearing existing tokens...');
      
      // First clear out any existing tokens
      localStorage.removeItem('jwtToken');
      
      console.log('🔍 AUTH DEBUG: Storing new token in localStorage...');
      
      // Store the valid token in localStorage with direct method
      try {
        // Use direct setting first
        localStorage.setItem('jwtToken', idToken);
        
        // Verify it was saved
        const savedToken = localStorage.getItem('jwtToken');
        console.log('🔍 AUTH DEBUG: Token saved successfully, length:', savedToken ? savedToken.length : 'NOT SAVED');
        
        if (!savedToken) {
          throw new Error('Token was not saved to localStorage');
        }
      } catch (storageErr) {
        console.error('🔍 AUTH ERROR: Failed to save token to localStorage:', storageErr);
        throw storageErr;
      }
      
      // Check if there's a saved redirect URL in sessionStorage
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      console.log('🔍 AUTH DEBUG: Redirecting to:', redirectUrl);
      
      // Clear the saved redirect URL
      sessionStorage.removeItem('redirectUrl');
      
      // Redirect to the saved URL or home page
      window.location.assign(redirectUrl);
    } catch (err) {
      console.error('🔍 AUTH ERROR: Exception in login function:', err);
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
