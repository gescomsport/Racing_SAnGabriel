import axios from "axios";

const TOKEN_KEY = "sudeporte_token";

// En producción: /api → Netlify proxy → VPS (api.sudeporte.com)
// En desarrollo: REACT_APP_BACKEND_URL/api (http://localhost:8000)
const BASE = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const ax = axios.create({ baseURL: BASE });

ax.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

export default ax;
