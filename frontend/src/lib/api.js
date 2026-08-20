import axios from "axios";

const backendBaseUrl = process.env.REACT_APP_BACKEND_URL?.trim() || window.location.origin;

export const api = axios.create({
  baseURL: `${backendBaseUrl}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (
      err.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url.includes("/auth/login") &&
      !original.url.includes("/auth/register") &&
      !original.url.includes("/auth/me") &&
      !original.url.includes("/auth/refresh")
    ) {
      original._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(original);
      } catch (e) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export function formatApiError(err, fallback = "Algo deu errado. Tente novamente.") {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  return fallback;
}
