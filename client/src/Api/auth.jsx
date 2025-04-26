const login = async (userInfo) => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInfo),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Authentication failed');
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return data;
  } catch (err) {
    console.log('Error from user login: ', err);
    return Promise.reject(err.message || 'Could not fetch user info');
  }
};

const register = async (userInfo) => {
  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInfo),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return data;
  } catch (err) {
    console.log('Error from user registration: ', err);
    return Promise.reject(err.message || 'Could not register user');
  }
};

export { login, register };