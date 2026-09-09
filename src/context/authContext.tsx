/**
 * Auth Context & State Management
 * Clean state provider with dependency injection for IAuthRepository.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AuthCredentials, OAuthProvider, SignUpData, User } from '@/domain/models/auth';
import { IAuthRepository } from '@/domain/repositories/authRepository.interface';
import { defaultAuthRepository } from '@/data/repositories/authRepository';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  skipAuth: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  repository?: IAuthRepository;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  repository = defaultAuthRepository,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to repository auth changes
    const unsubscribe = repository.onAuthStateChanged((activeUser) => {
      setUser(activeUser);
      if (activeUser) {
        setIsGuest(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [repository]);

  const clearError = () => setError(null);

  const login = async (credentials: AuthCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      await repository.login(credentials);
      setIsGuest(false);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    setIsLoading(true);
    setError(null);
    try {
      await repository.signUp(data);
      setIsGuest(false);
    } catch (err: any) {
      setError(err?.message || 'Sign up failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOAuth = async (provider: OAuthProvider) => {
    setIsLoading(true);
    setError(null);
    try {
      await repository.loginWithOAuth(provider);
      setIsGuest(false);
    } catch (err: any) {
      setError(err?.message || `OAuth login with ${provider} failed.`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const skipAuth = () => {
    setError(null);
    setIsGuest(true);
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await repository.logout();
      setIsGuest(false);
    } catch (err: any) {
      setError(err?.message || 'Logout failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isGuest,
      isLoading,
      error,
      login,
      signUp,
      loginWithOAuth,
      skipAuth,
      logout,
      clearError,
    }),
    [user, isGuest, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
