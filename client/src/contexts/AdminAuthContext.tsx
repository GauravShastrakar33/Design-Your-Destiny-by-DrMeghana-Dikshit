import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    const storedAdmin = localStorage.getItem("@app:admin_user");
    
    if (token && storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        if (["SUPER_ADMIN", "COACH"].includes(parsedAdmin.role)) {
          setAdmin(parsedAdmin);
        } else {
          localStorage.removeItem("@app:admin_token");
          localStorage.removeItem("@app:admin_user");
        }
      } catch {
        localStorage.removeItem("@app:admin_token");
        localStorage.removeItem("@app:admin_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, adminData: AdminUser) => {
    localStorage.setItem("@app:admin_token", token);
    localStorage.setItem("@app:admin_user", JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem("@app:admin_token");
    localStorage.removeItem("@app:admin_user");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin && ["SUPER_ADMIN", "COACH"].includes(admin.role),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
