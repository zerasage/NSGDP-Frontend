"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as authApi from "@/lib/api/auth";
import * as tokenStorage from "@/lib/utils/token-storage";
import type { UserProfile } from "@/lib/types/auth";
import type { LoginFormData, RegisterFormData } from "@/lib/schemas/auth";
import { toast } from "sonner";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<{ isPending: boolean }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from tokens on mount
  useEffect(() => {
    const loadUser = async () => {
      const accessToken = tokenStorage.getAccessToken();
      
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (tokenStorage.isTokenExpired()) {
        // Try to refresh
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          tokenStorage.clearTokens();
          setIsLoading(false);
          return;
        }

        try {
          const response = await authApi.refreshAccessToken({ refreshToken });
          tokenStorage.updateAccessToken(response.accessToken, response.expiresIn);
          
          const userProfile = await authApi.getCurrentUser();
          setUser(userProfile);
        } catch {
          // Refresh failed, clear everything
          tokenStorage.clearTokens();
          setUser(null);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const userProfile = await authApi.getCurrentUser();
        setUser(userProfile);
      } catch {
        // Token invalid, try refresh
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          tokenStorage.clearTokens();
          setIsLoading(false);
          return;
        }

        try {
          const response = await authApi.refreshAccessToken({ refreshToken });
          tokenStorage.updateAccessToken(response.accessToken, response.expiresIn);
          
          const userProfile = await authApi.getCurrentUser();
          setUser(userProfile);
        } catch {
          // Refresh failed, clear everything
          tokenStorage.clearTokens();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (data: LoginFormData) => {
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      if (!response.tokens) {
        throw new Error("Login failed: No tokens received");
      }

      // Store tokens
      tokenStorage.storeTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken,
        response.tokens.expiresIn
      );

      setUser(response.user);
      toast.success("Logged in successfully");
      // Callers own the post-login redirect (login page uses ?returnTo=).
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterFormData): Promise<{ isPending: boolean }> => {
    try {
      const response = await authApi.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phone,
        accessLevel: "public",
        reason: data.reason,
      });

      // Check if user needs approval (tokens will be null)
      if (!response.tokens) {
        // Account pending approval
        toast.success("Registration successful! Your account is pending approval.");
        return { isPending: true };
      }

      // Auto-login for public users
      tokenStorage.storeTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken,
        response.tokens.expiresIn
      );

      setUser(response.user);
      toast.success("Registration successful!");
      router.push("/dashboard");
      return { isPending: false };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast.error(errorMessage);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      toast.success("Logged out successfully");
      router.push("/");
    }
  }, [router]);

  const refreshSession = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await authApi.refreshAccessToken({ refreshToken });
      
      // Update access token
      tokenStorage.updateAccessToken(response.accessToken, response.expiresIn);

      // Fetch updated user profile
      const userProfile = await authApi.getCurrentUser();
      setUser(userProfile);
    } catch {
      // Refresh failed, clear everything
      tokenStorage.clearTokens();
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
