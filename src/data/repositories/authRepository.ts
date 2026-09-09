/**
 * Concrete Authentication Repository Implementation
 * Implements IAuthRepository following Clean Architecture.
 * Bridges UI with Firebase Auth / Backend API endpoints.
 */

import { AuthCredentials, AuthResult, OAuthProvider, SignUpData, User } from '@/domain/models/auth';
import { IAuthRepository } from '@/domain/repositories/authRepository.interface';
import { apiClient } from '../api/apiClient';

export class AuthRepository implements IAuthRepository {
  private currentUser: User | null = null;
  private currentToken: string | null = null;
  private authListeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    // Connect token getter to API client for automatic Bearer header injection
    apiClient.setAuthTokenGetter(async () => this.getIdToken());
  }

  private notifyListeners() {
    this.authListeners.forEach((listener) => listener(this.currentUser));
  }

  public async login(credentials: AuthCredentials): Promise<AuthResult> {
    // Basic validation
    if (!credentials.email || !credentials.email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!credentials.password || credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Simulate network delay for mock / or hook to Firebase Auth signInWithEmailAndPassword
    await new Promise((resolve) => setTimeout(resolve, 600));

    const user: User = {
      id: `user_${Date.now()}`,
      email: credentials.email.trim().toLowerCase(),
      displayName: credentials.email.split('@')[0],
      createdAt: new Date().toISOString(),
    };

    const token = `mock_firebase_id_token_${Date.now()}`;
    this.currentUser = user;
    this.currentToken = token;
    this.notifyListeners();

    return { user, token };
  }

  public async signUp(data: SignUpData): Promise<AuthResult> {
    if (!data.email || !data.email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Simulate network latency / or hook to Firebase Auth createUserWithEmailAndPassword
    await new Promise((resolve) => setTimeout(resolve, 600));

    const user: User = {
      id: `user_${Date.now()}`,
      email: data.email.trim().toLowerCase(),
      displayName: data.email.split('@')[0],
      createdAt: new Date().toISOString(),
    };

    const token = `mock_firebase_id_token_${Date.now()}`;
    this.currentUser = user;
    this.currentToken = token;
    this.notifyListeners();

    return { user, token };
  }

  public async loginWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
    // Simulate OAuth handshake
    await new Promise((resolve) => setTimeout(resolve, 700));

    const providerNames: Record<OAuthProvider, string> = {
      google: 'Google User',
      apple: 'Apple User',
      binance: 'Binance User',
      wallet: 'Web3 Wallet User',
    };

    const user: User = {
      id: `${provider}_user_${Date.now()}`,
      email: `${provider}.user@ghumo.app`,
      displayName: providerNames[provider],
      createdAt: new Date().toISOString(),
    };

    const token = `oauth_${provider}_token_${Date.now()}`;
    this.currentUser = user;
    this.currentToken = token;
    this.notifyListeners();

    return { user, token };
  }

  public async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.currentUser = null;
    this.currentToken = null;
    this.notifyListeners();
  }

  public async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  public async getIdToken(): Promise<string | null> {
    return this.currentToken;
  }

  public onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authListeners.add(callback);
    // Immediately invoke with current state
    callback(this.currentUser);

    return () => {
      this.authListeners.delete(callback);
    };
  }
}

export const defaultAuthRepository = new AuthRepository();
