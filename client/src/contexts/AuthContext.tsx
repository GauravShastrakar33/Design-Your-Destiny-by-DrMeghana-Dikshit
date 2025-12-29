import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { queryClient } from "@/lib/queryClient";
import { refreshPushToken, setupForegroundNotifications } from "@/lib/notifications";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("@app:user_token");
    const storedUser = localStorage.getItem("@app:user");
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Refresh push token on app load to ensure DB has latest FCM token
        // This handles cases where the browser generated a new token
        refreshPushToken().then((refreshed) => {
          if (refreshed) {
            console.log("✅ Push token refreshed on app load");
          }
        });
        
        // Setup foreground notification handler
        setupForegroundNotifications();
      } catch {
        localStorage.removeItem("@app:user_token");
        localStorage.removeItem("@app:user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("@app:user_token", token);
    localStorage.setItem("@app:user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("@app:user_token");
    localStorage.removeItem("@app:user");
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
