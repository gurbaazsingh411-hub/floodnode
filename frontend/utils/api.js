import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api', // Default to local backend
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to log requests (optional, can be removed in production)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.message}`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Get latest sensor readings
  getLatestReadings: async () => {
    try {
      const response = await apiClient.get('/latest-readings');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get historical data for a specific node
  getNodeHistory: async (nodeId) => {
    try {
      const response = await apiClient.get(`/node-history/${nodeId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get flood risk analysis
  getFloodRisk: async () => {
    try {
      const response = await apiClient.get('/flood-risk');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default apiClient;