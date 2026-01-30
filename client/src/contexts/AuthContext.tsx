import { Capacitor } from "@capacitor/core";
import { initializeNativePush } from "@/lib/nativePush";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { queryClient } from "@/lib/queryClient";
import { refreshPushToken, setupForegroundNotifications } from "@/lib/notifications";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  forcePasswordChange?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresPasswordChange: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  clearPasswordChangeRequirement: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem("@app:user_token");
  const storedUser = localStorage.getItem("@app:user");

  if (token && storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Check if user needs to change password
      if (parsedUser.forcePasswordChange) {
        setRequiresPasswordChange(true);
      }

      if (Capacitor.isNativePlatform()) {
        // 📱 Android / iOS
        initializeNativePush().then(() => {
          console.log("📱 Native push initialized");
        });
      } else {
        // 🌐 Web / PWA
        refreshPushToken().then((refreshed) => {
          if (refreshed) {
            console.log("🌐 Web push token refreshed");
          }
        });

        setupForegroundNotifications();
      }
    } catch (error) {
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
  
  // Check if user needs to change password
  if (userData.forcePasswordChange) {
    setRequiresPasswordChange(true);
  }

  // 🔔 Register push AFTER login
  if (Capacitor.isNativePlatform()) {
    initializeNativePush().then(() => {
      console.log("📱 Native push initialized after login");
    });
  }
};

const clearPasswordChangeRequirement = () => {
  setRequiresPasswordChange(false);
  // Update stored user to remove the flag
  if (user) {
    const updatedUser = { ...user, forcePasswordChange: false };
    localStorage.setItem("@app:user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }
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
        requiresPasswordChange,
        login,
        logout,
        clearPasswordChangeRequirement,
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
