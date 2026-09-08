import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import { getToken, setToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(payload) {
    const data = await authApi.login(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(payload) {
    const data = await authApi.signup(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // 이미 만료된 토큰이어도 클라이언트 세션은 정리한다.
    }
    setToken(null);
    setUser(null);
  }

  function updateUser(patch) {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
