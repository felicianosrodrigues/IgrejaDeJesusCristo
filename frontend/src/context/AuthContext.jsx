import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = carregando, false = deslogado
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (e) {
        setUser(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      setLoading(false);
      return response.data;
    } catch (e) {
      setUser(false);
      setLoading(false);
      return null;
    }
  };

  const logout = async () => {
    setUser(false); // Optimistic update - UI changes immediately
    setLoading(true);
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Logout failed on server, but we've already updated UI locally
      console.error("Logout failed", e);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);