import axios from "axios";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333/api" });

const lerToken = () => localStorage.getItem("token") ?? sessionStorage.getItem("token");

api.interceptors.request.use((config) => {
  const token = lerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && lerToken()) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("usuario");
      if (location.pathname !== "/login") location.assign("/login");
    }
    return Promise.reject(error);
  },
);
