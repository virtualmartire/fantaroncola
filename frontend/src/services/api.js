const API_URL = 'http://localhost:3000/api';

export const api = {
  async request(endpoint, method = 'GET', body = null, token = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    const authToken = token || localStorage.getItem('token');
    if (authToken) {
      headers['x-auth-token'] = authToken;
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  post(endpoint, body, token = null) {
    return this.request(endpoint, 'POST', body, token);
  },

  get(endpoint, token = null) {
    return this.request(endpoint, 'GET', null, token);
  }
};
