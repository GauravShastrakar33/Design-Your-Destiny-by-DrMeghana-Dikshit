import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, Loader2, Image, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

const loginSchema = yup
  .object({
    email: yup
      .string()
      .required("Email is required")
      .email("Invalid email format"),
    password: yup
      .string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
  })
  .required();

type LoginForm = yup.InferType<typeof loginSchema>;

export default function UserLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
  });

  if (isAuthenticated) {
    return <Redirect to="/home" />;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/v1/auth/login", {
        email: data.email,
        password: data.password,
      });

      const result = await response.json();

      if (response.ok && result.token) {
        await login(result.token, result.user);
        toast({
          title: "Welcome back!",
          description: `Hello, ${result.user.name}!`,
        });
        if (result.user.forcePasswordChange) {
          setLocation("/account-settings");
        } else {
          setLocation("/home");
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 md:p-12 overflow-hidden bg-[#0F172A]">
      {/* Premium Multi-Layered Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Deep Indigo Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#cfbcfc] via-[#8c54e0] to-[#cfbcfc] opacity-90" />

        {/* Dynamic Luminous Orbs - High Intensity & Visibility */}
        <motion.div
          animate={{
            x: [-150, 150, -150],
            y: [-120, 150, -120],
            scale: [1, 1.4, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[50%] -left-[20%] w-[80%] h-[80%] rounded-full bg-purple-900/50 blur-[50px]"
        />

        <motion.div
          animate={{
            x: [150, -150, 120],
            y: [100, -150, 100],
            scale: [1.3, 1, 1.3],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[50%] -right-[20%] w-[85%] h-[85%] rounded-full bg-purple-900/50 blur-[50px]"
        />

        <motion.div
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/3 w-[60%] h-[60%] rounded-full bg-cyan-800/20 blur-[50px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-[400px] md:max-w-[540px] z-10"
      >
        {/* Modern Glassmorphism Login Card - Optimized for Mobile */}
        <div className="bg-white/90 backdrop-blur-2xl p-7 sm:p-12 md:p-14 rounded-2xl shadow-sm border border-white/20">
          <div className="flex flex-col items-center justify-center gap-2 mb-5 md:mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand/10 rounded-full mb-1">
              <User className="w-8 h-8 text-indigo-900" />
            </div>

            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-indigo-900 tracking-tight sm:mb-4">
                Design Your Destiny by
              </h1>
              <h1 className="text-xl md:text-2xl font-bold text-indigo-900 tracking-tight sm:mb-4 mt-1">
                Dr. Meghana Dikshit
              </h1>
              <p className="text-slate-800 font-semibold text-xs sm:text-base mt-2">
                Sign in to continue your holistic wellness journey
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 sm:space-y-8"
          >
            <div className="space-y-3 sm:space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm sm:text-sm font-bold text-slate-800 tracking-wide ml-1"
                >
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5E29E2] transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register("email")}
                    disabled={isLoading}
                    className={`h-10 sm:h-12 pl-12 bg-white border-slate-300 rounded-lg focus-visible:ring-4 focus-visible:ring-[#5E29E2]/10 focus:border-[#5E29E2] transition-all text-slate-900 font-medium text-sm sm:text-base ${
                      errors.email
                        ? "border-red-500 focus:border-red-500 focus-visible:ring-red-500/10"
                        : ""
                    }`}
                    data-testid="input-user-email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs font-semibold ml-1 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm sm:text-sm font-bold text-slate-800 tracking-wide ml-1"
                >
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5E29E2] transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    disabled={isLoading}
                    className={`h-10 sm:h-12 pl-12 pr-12 bg-white border-slate-300 rounded-lg focus-visible:ring-4 focus-visible:ring-[#5E29E2]/10 focus:border-[#5E29E2] transition-all text-slate-900 font-medium text-sm sm:text-base ${
                      errors.password
                        ? "border-red-500 focus:border-red-500 focus-visible:ring-red-500/10"
                        : ""
                    }`}
                    data-testid="input-user-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs font-semibold ml-1 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 sm:h-12 bg-gradient-to-r from-[#703DFA] to-[#5E29E2] hover:shadow-2xl hover:shadow-[#703DFA]/40 text-white text-base sm:text-lg font-bold rounded-lg transition-all active:scale-[0.98] mt-2 flex items-center justify-center"
              data-testid="button-user-login"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
