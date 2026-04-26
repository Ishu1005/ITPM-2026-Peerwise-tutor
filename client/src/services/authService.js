import axios from 'axios';

axios.defaults.withCredentials = true;

const API_BASE_URL = 'http://localhost:5000/api/auth';

export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Login failed' };
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Registration failed' };
    }
  },

  // Logout user
  async logout() {
    try {
      const response = await axios.get(`${API_BASE_URL}/logout`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Logout failed' };
    }
  },

  // Get current session user
  async getCurrentSession() {
    try {
      const response = await axios.get(`${API_BASE_URL}/session`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'No session found' };
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return this.getCurrentSession()
      .then(response => !!response.user)
      .catch(() => false);
  }
};

export default authService;