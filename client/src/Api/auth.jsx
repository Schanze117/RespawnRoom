const login = async (userInfo) => {
  try {
    const response = await fetch('/auth/login', { // Updated URL with correct port
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInfo),
    });

    if (!response.ok) {
      throw new Error('User information not retrieved, check network tab!');
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return data;
  } catch (err) {
    console.log('Error from user login: ', err);
    return Promise.reject('Could not fetch user info');
  }
};

export { login };