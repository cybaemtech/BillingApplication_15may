import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setToken, clearToken } from "@/lib/api-client";

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bf_token");
    if (!token) { setLoading(false); return; }
    api.get<AuthUser>("/auth/me")
      .then((u) => setUser(u))
      .catch(() => { clearToken(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post<{ token: string; user: AuthUser }>("/auth/signin", { email, password });
      setToken(res.token);
      setUser(res.user);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const res = await api.post<{ token: string; user: AuthUser }>("/auth/signup", { email, password, displayName });
      setToken(res.token);
      setUser(res.user);
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signOut = async () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole: user?.role || null, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
