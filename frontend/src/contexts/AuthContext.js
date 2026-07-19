import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// En producción (Netlify) usamos /api que el proxy reenvía al VPS (api.sudeporte.com)
// En local usamos REACT_APP_BACKEND_URL (http://localhost:8000)
const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND}/api`;
const AuthContext = createContext(null);

const TOKEN_KEY = "sudeporte_token";

// Interceptor global: añade Authorization header si hay token en localStorage
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.get(`${API}/auth/me`);
      setUser(data);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data);
    return data;
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(false);
    try { await axios.post(`${API}/auth/logout`, {}); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
