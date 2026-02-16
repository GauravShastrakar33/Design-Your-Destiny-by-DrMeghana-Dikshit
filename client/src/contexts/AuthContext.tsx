import { Capacitor } from "@capacitor/core";
import { initPushNotifications, syncTokenWithBackend } from "@/lib/nativePush";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { refreshPushToken, setupForegroundNotifications } from "@/lib/notifications";
import { Preferences } from "@capacitor/preferences";

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
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  clearPasswordChangeRequirement: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { value: token } = await Preferences.get({ key: "@app:user_token" });
        const { value: storedUser } = await Preferences.get({ key: "@app:user" });

        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Optimistically set user from storage first
            setUser(parsedUser);

            // Check if user needs to change password
            if (parsedUser.forcePasswordChange) {
              setRequiresPasswordChange(true);
            }

            // 🔄 Refresh user data from backend to ensure we have latest name/role
            // This fixes issues where local storage has stale/incomplete data
            try {
              const response = await apiRequest("GET", "/api/v1/me");
              if (response.ok) {
                const freshUserData = await response.json();
                // Merge with existing session data (like token) if needed, 
                // but here endpoint returns profile data.
                // Re-construct user object matching User interface
                const updatedUser: User = {
                  id: freshUserData.id,
                  name: freshUserData.name,
                  email: freshUserData.email,
                  role: freshUserData.role,
                  forcePasswordChange: freshUserData.forcePasswordChange
                };

                setUser(updatedUser);
                await Preferences.set({ key: "@app:user", value: JSON.stringify(updatedUser) });
              } else if (response.status === 401) {
                // Token expired or invalid
                console.log("Token invalid, logging out");
                await Preferences.remove({ key: "@app:user_token" });
                await Preferences.remove({ key: "@app:user" });
                setUser(null);
                queryClient.clear();
                setIsLoading(false);
                return; // Stop execution
              }
            } catch (apiError) {
              console.error("Failed to refresh user profile from backend:", apiError);
              // We continue with stored user data if backend fetch fails (offline flow)
            }

            if (Capacitor.isNativePlatform()) {
              // 📱 Android / iOS - Fire and forget, don't block rendering
              initPushNotifications().then(() => {
                console.log("📱 Native push initialized");
                // 🔄 Sync token if it was already cached
                syncTokenWithBackend();
              }).catch((error) => {
                // Already logged in initPushNotifications, just prevent unhandled rejection
                console.error("⚠️ Push init failed in AuthContext (non-blocking):", error);
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
            console.error("Failed to parse user data", error);
            await Preferences.remove({ key: "@app:user_token" });
            await Preferences.remove({ key: "@app:user" });
          }
        }
      } catch (error) {
        console.error("Auth initialization failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);


  const login = async (token: string, userData: User) => {
    await Preferences.set({ key: "@app:user_token", value: token });
    await Preferences.set({ key: "@app:user", value: JSON.stringify(userData) });
    setUser(userData);

    // Check if user needs to change password
    if (userData.forcePasswordChange) {
      setRequiresPasswordChange(true);
    }

    // 🔔 Register push AFTER login - Fire and forget, don't block UI
    if (Capacitor.isNativePlatform()) {
      initPushNotifications().then(() => {
        console.log("📱 Native push initialized after login");
        // 🚀 CRITICAL: Sync the token now that we have the Auth token!
        syncTokenWithBackend();
      }).catch((error) => {
        // Already logged in initPushNotifications, just prevent unhandled rejection
        console.error("⚠️ Push init after login failed (non-blocking):", error);
      });
    }
  };

  const clearPasswordChangeRequirement = async () => {
    setRequiresPasswordChange(false);
    // Update stored user to remove the flag
    if (user) {
      const updatedUser = { ...user, forcePasswordChange: false };
      await Preferences.set({ key: "@app:user", value: JSON.stringify(updatedUser) });
      setUser(updatedUser);
    }
  };


  const logout = async () => {
    await Preferences.remove({ key: "@app:user_token" });
    await Preferences.remove({ key: "@app:user" });
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
