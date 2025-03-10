import jwtDecode from 'jwt-decode';

class AuthService {
  getProfile() {
    // Decode the JSON Web Token (JWT) using the jwtDecode function.
    // This function takes the token obtained from getToken() and decodes it to extract the user profile information.
    return jwtDecode(this.getToken());
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
    } catch (err) {
      // If there is an error during decoding, log the error and return false.
      return false;
    }
  }

  getToken() {
    const loggedUser = localStorage.getItem('id_token') || '';
    return loggedUser;
  }

  login(idToken) {
    localStorage.setItem('id_token', idToken);
    window.location.assign('/');
  }

  logout() {
    localStorage.removeItem('id_token');
    window.location.assign('/');
  }
}

export default new AuthService();
