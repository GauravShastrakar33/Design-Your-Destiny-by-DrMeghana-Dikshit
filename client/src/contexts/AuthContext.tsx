import { Capacitor } from "@capacitor/core";
import { initPushNotifications, syncTokenWithBackend } from "@/lib/nativePush";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { queryClient, apiRequest, clearCachedTokens } from "@/lib/queryClient";
import {
  refreshPushToken,
  setupForegroundNotifications,
} from "@/lib/notifications";
import { Preferences } from "@capacitor/preferences";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  forcePasswordChange?: boolean;
}

interface AuthStateContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresPasswordChange: boolean;
}

interface AuthActionsContextType {
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  clearPasswordChangeRequirement: () => void;
}

const AuthStateContext = createContext<AuthStateContextType | undefined>(
  undefined
);
const AuthActionsContext = createContext<AuthActionsContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { value: token } = await Preferences.get({
          key: "@app:user_token",
        });
        const { value: storedUser } = await Preferences.get({
          key: "@app:user",
        });

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
            try {
              const response = await apiRequest("GET", "/api/v1/me");
              if (response.ok) {
                const freshUserData = await response.json();
                const updatedUser: User = {
                  id: freshUserData.id,
                  name: freshUserData.name,
                  email: freshUserData.email,
                  role: freshUserData.role,
                  forcePasswordChange: freshUserData.forcePasswordChange,
                };

                setUser(updatedUser);
                await Preferences.set({
                  key: "@app:user",
                  value: JSON.stringify(updatedUser),
                });
              } else if (response.status === 401) {
                // Token expired or invalid
                console.log("Token invalid, logging out");
                await Preferences.remove({ key: "@app:user_token" });
                await Preferences.remove({ key: "@app:user" });
                setUser(null);
                queryClient.clear();
                setIsLoading(false);
                return;
              }
            } catch (apiError) {
              console.error(
                "Failed to refresh user profile from backend:",
                apiError
              );
            }

            if (Capacitor.isNativePlatform()) {
              initPushNotifications()
                .then(() => {
                  syncTokenWithBackend();
                })
                .catch((error) => {
                  console.error(
                    "⚠️ Push init failed in AuthContext (non-blocking):",
                    error
                  );
                });
            } else {
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
    await Preferences.set({
      key: "@app:user",
      value: JSON.stringify(userData),
    });
    clearCachedTokens();
    setUser(userData);

    if (userData.forcePasswordChange) {
      setRequiresPasswordChange(true);
    }

    if (Capacitor.isNativePlatform()) {
      initPushNotifications()
        .then(() => {
          syncTokenWithBackend();
        })
        .catch((error) => {
          console.error(
            "⚠️ Push init after login failed (non-blocking):",
            error
          );
        });
    }
  };

  const clearPasswordChangeRequirement = async () => {
    setRequiresPasswordChange(false);
    if (user) {
      const updatedUser = { ...user, forcePasswordChange: false };
      await Preferences.set({
        key: "@app:user",
        value: JSON.stringify(updatedUser),
      });
      setUser(updatedUser);
    }
  };

  const logout = async () => {
    // 🔴 Clear App Icon Badge
    if (Capacitor.isNativePlatform()) {
      try {
        const { Badge } = await import("@capawesome/capacitor-badge");
        await Badge.clear();
        console.log("📱 [AUTH] Badge cleared on logout");
      } catch (e) {
        console.warn("⚠️ Failed to clear badge on logout", e);
      }
    }

    await Preferences.remove({ key: "@app:user_token" });
    await Preferences.remove({ key: "@app:user" });
    clearCachedTokens();
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthStateContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        requiresPasswordChange,
      }}
    >
      <AuthActionsContext.Provider
        value={{
          login,
          logout,
          clearPasswordChangeRequirement,
        }}
      >
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

/** 🧊 Returns only auth state: user, loading status, etc. Causes re-renders on user change. */
export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error("useAuthState must be used within an AuthProvider");
  }
  return context;
}

/** ⚡ Returns only auth actions: login, logout. Never causes re-renders. */
export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error("useAuthActions must be used within an AuthProvider");
  }
  return context;
}

/** 🔄 Backward compatibility hook — provides both state and actions. */
export function useAuth() {
  const state = useAuthState();
  const actions = useAuthActions();
  return { ...state, ...actions };
}
