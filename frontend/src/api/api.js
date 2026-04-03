import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 10000,
});

// Add shop ID to all requests automatically
api.interceptors.request.use((config) => {
  const shopId = localStorage.getItem('selectedShop');
  if (shopId) {
    // Add shopId as query parameter for GET requests
    if (config.method === 'get') {
      config.params = config.params || {};
      config.params.shopId = shopId;
    } else {
      // For FormData (multipart), add as query param (shopFilter runs before multer parses body)
      if (config.data instanceof FormData) {
        config.params = config.params || {};
        config.params.shopId = shopId;
      } else {
        // For regular JSON objects, add to request body
        config.data = config.data || {};
        config.data.shopId = shopId;
      }
    }
  }
  return config;
});

export default api;

