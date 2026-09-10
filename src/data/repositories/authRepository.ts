/**
 * Concrete Authentication Repository Implementation
 * Powered by Supabase Auth (@supabase/supabase-js)
 * Supports Email/Password and Google/OAuth with automatic token persistence.
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthCredentials, AuthResult, OAuthProvider, SignUpData, User } from '@/domain/models/auth';
import { IAuthRepository } from '@/domain/repositories/authRepository.interface';
import { supabase } from '@/utils/supabase';
import { apiClient } from '../api/apiClient';

WebBrowser.maybeCompleteAuthSession();

export class AuthRepository implements IAuthRepository {
  private currentUser: User | null = null;
  private authListeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    // Connect token getter to API client for automatic Bearer header injection
    apiClient.setAuthTokenGetter(async () => this.getIdToken());

    // Listen to real-time auth changes from Supabase
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.currentUser = this.mapSupabaseUser(session.user);
      } else {
        this.currentUser = null;
      }
      this.notifyListeners();
    });

    // Initialize initial session
    this.initSession();
  }

  private async initSession() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        this.currentUser = this.mapSupabaseUser(data.session.user);
        this.notifyListeners();
      }
    } catch (err) {
      console.warn('[AuthRepository] Failed to restore session', err);
    }
  }

  private mapSupabaseUser(supabaseUser: any): User {
    const metadata = supabaseUser.user_metadata || {};
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      displayName: metadata.display_name || metadata.full_name || metadata.name || supabaseUser.email?.split('@')[0] || 'Traveler',
      photoURL: metadata.avatar_url || metadata.picture,
      createdAt: supabaseUser.created_at || new Date().toISOString(),
    };
  }

  private notifyListeners() {
    this.authListeners.forEach((listener) => listener(this.currentUser));
  }

  public async login(credentials: AuthCredentials): Promise<AuthResult> {
    if (!credentials.email || !credentials.email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!credentials.password || credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed. Please verify your credentials.');
    }

    const user = this.mapSupabaseUser(data.user);
    this.currentUser = user;
    this.notifyListeners();

    return {
      user,
      token: data.session.access_token,
    };
  }

  public async signUp(data: SignUpData): Promise<AuthResult> {
    if (!data.email || !data.email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const displayName = data.email.split('@')[0];
    const { data: resData, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!resData.user) {
      throw new Error('Registration failed. Please try again.');
    }

    const user = this.mapSupabaseUser(resData.user);
    this.currentUser = user;
    this.notifyListeners();

    return {
      user,
      token: resData.session?.access_token || '',
    };
  }

  public async loginWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
    const supabaseProvider = provider === 'google' ? 'google' : provider === 'apple' ? 'apple' : 'google';
    const redirectUrl = Linking.createURL('/');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.url) {
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (res.type === 'success' && res.url) {
        // Parse access_token from query or hash fragment
        const urlToParse = res.url.includes('#') ? res.url.replace('#', '?') : res.url;
        const parsed = new URL(urlToParse);
        const accessToken = parsed.searchParams.get('access_token');
        const refreshToken = parsed.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionErr) throw new Error(sessionErr.message);

          if (sessionData.user && sessionData.session) {
            const user = this.mapSupabaseUser(sessionData.user);
            this.currentUser = user;
            this.notifyListeners();
            return { user, token: sessionData.session.access_token };
          }
        }
      }
    }

    // Refresh and check current session
    const { data: currentSession } = await supabase.auth.getSession();
    if (currentSession?.session?.user) {
      const user = this.mapSupabaseUser(currentSession.session.user);
      this.currentUser = user;
      this.notifyListeners();
      return { user, token: currentSession.session.access_token };
    }

    throw new Error('OAuth sign-in cancelled or pending.');
  }

  public async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[AuthRepository] Sign out error:', error.message);
    }
    this.currentUser = null;
    this.notifyListeners();
  }

  public async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      this.currentUser = this.mapSupabaseUser(data.user);
      return this.currentUser;
    }
    return null;
  }

  public async getIdToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  public onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authListeners.add(callback);
    callback(this.currentUser);

    return () => {
      this.authListeners.delete(callback);
    };
  }
}

export const defaultAuthRepository = new AuthRepository();
