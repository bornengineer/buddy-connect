import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const http = axios.create({
  baseURL: `${baseURL}/api`,
});

export function setAuthToken(token: string | null) {
  if (!token) {
    delete http.defaults.headers.common.Authorization;
    return;
  }
  http.defaults.headers.common.Authorization = `Bearer ${token}`;
}
