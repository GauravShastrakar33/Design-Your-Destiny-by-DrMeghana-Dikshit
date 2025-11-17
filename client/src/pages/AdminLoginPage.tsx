import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter the admin password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        localStorage.setItem("@app:admin_auth", password);
        toast({
          title: "Login successful",
          description: "Welcome to the admin panel",
        });
        setLocation("/admin");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white border border-gray-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand/10 rounded-full mb-4">
            <Lock className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Enter password to access admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full"
              data-testid="input-admin-password"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            style={{ backgroundColor: "#703DFA" }}
            data-testid="button-admin-login"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Default password: <code className="bg-gray-100 px-2 py-1 rounded">admin123</code>
        </p>
      </Card>
    </div>
  );
}
