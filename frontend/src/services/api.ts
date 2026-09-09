import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ""}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("location_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("location_token");
      localStorage.removeItem("location_user");
    }
    return Promise.reject(error);
  }
);

export const getApiMessage = (error: unknown, fallback = "Something went wrong.") => {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return "You do not have permission to view this area.";
  }
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return fallback;
};
