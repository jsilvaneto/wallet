import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("wallet_token");
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("wallet_token");
      window.dispatchEvent(new Event("storage"));
    }
    return Promise.reject(error);
  }
);
