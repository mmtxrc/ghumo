/**
 * Concrete Authentication Repository Implementation
 * Powered by Supabase Auth (@supabase/supabase-js)
 * Supports Email/Password and Google/OAuth with automatic token persistence.
 */

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthCredentials, AuthResult, OAuthProvider, SignUpData, User } from '@/domain/models/auth';
import { IAuthRepository } from '@/domain/repositories/authRepository.interface';
import { supabase } from '@/utils/supabase';
import { logger } from '@/utils/logger';
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

    // Listen for incoming deep link URLs (e.g. exp://... or ghumo://...)
    Linking.addEventListener('url', (event) => {
      if (event.url) {
        this.handleAuthUrl(event.url);
      }
    });

    // Check initial deep link URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleAuthUrl(url);
      }
    });

    // Initialize initial session
    this.initSession();
  }

  private async handleAuthUrl(url: string) {
    try {
      logger.auth(`Received deep link URL: ${url}`);
      const urlToParse = url.includes('#') ? url.replace('#', '?') : url;
      let code: string | null = null;
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      try {
        const parsed = new URL(urlToParse);
        code = parsed.searchParams.get('code');
        accessToken = parsed.searchParams.get('access_token');
        refreshToken = parsed.searchParams.get('refresh_token');
      } catch {
        const codeMatch = url.match(/[?&]code=([^&]+)/);
        if (codeMatch) code = decodeURIComponent(codeMatch[1]);
        const tokenMatch = url.match(/[?&#]access_token=([^&]+)/);
        if (tokenMatch) accessToken = decodeURIComponent(tokenMatch[1]);
        const refreshMatch = url.match(/[?&#]refresh_token=([^&]+)/);
        if (refreshMatch) refreshToken = decodeURIComponent(refreshMatch[1]);
      }

      if (code) {
        logger.auth('Exchanging PKCE code for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) logger.error('AUTH', 'Failed to exchange PKCE code', error.message);
        if (data.user) {
          this.currentUser = this.mapSupabaseUser(data.user);
          this.notifyListeners();
        }
      } else if (accessToken && refreshToken) {
        logger.auth('Setting session from deep link access token...');
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) logger.error('AUTH', 'Failed to set session tokens', error.message);
        if (data.user) {
          this.currentUser = this.mapSupabaseUser(data.user);
          this.notifyListeners();
        }
      }
    } catch (err: any) {
      logger.error('AUTH', 'Error handling auth deep link', err?.message);
    }
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

    // On Web platforms, trigger browser redirect flow directly
    if (Platform.OS === 'web') {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes('missing OAuth secret') || error.message.includes('validation_failed')) {
          throw new Error('Google OAuth is not configured in your Supabase project. Please add your Google Client ID & Client Secret in Supabase Dashboard -> Authentication -> Providers -> Google.');
        }
        throw new Error(error.message);
      }

      // Check if session was already established or is in progress
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session?.user) {
        const user = this.mapSupabaseUser(currentSession.session.user);
        this.currentUser = user;
        this.notifyListeners();
        return { user, token: currentSession.session.access_token };
      }

      return { user: this.currentUser!, token: '' };
    }

    // On Native mobile platforms, use Expo WebBrowser session
    const redirectUrl = Linking.createURL('/');
    logger.auth(`Constructed OAuth redirect URL: ${redirectUrl}`);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      if (error.message.includes('missing OAuth secret') || error.message.includes('validation_failed')) {
        throw new Error('Google OAuth is not configured in your Supabase project. Please enable Google in Supabase Dashboard -> Authentication -> Providers and enter your Client ID & Secret.');
      }
      throw new Error(error.message);
    }

    if (data?.url) {
      logger.auth(`Opening WebBrowser auth session for: ${data.url}`);
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      logger.auth(`WebBrowser session closed with status: ${res.type}`, res);

      // Check if session was updated via deep link listener or background auth state change
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session?.user) {
        logger.auth('Active session detected after browser session return');
        const user = this.mapSupabaseUser(currentSession.session.user);
        this.currentUser = user;
        this.notifyListeners();
        return { user, token: currentSession.session.access_token };
      }

      if (res.type === 'cancel' || res.type === 'dismiss') {
        throw new Error(
          `Google sign-in was cancelled or closed before completing. Please ensure "${redirectUrl}" is added to your Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs.`
        );
      }

      if (res.type === 'success' && res.url) {
        // Parse URL - handle both PKCE code flow (?code=...) and implicit token flow (#access_token=...)
        const urlToParse = res.url.includes('#') ? res.url.replace('#', '?') : res.url;
        let code: string | null = null;
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        try {
          const parsed = new URL(urlToParse);
          code = parsed.searchParams.get('code');
          accessToken = parsed.searchParams.get('access_token');
          refreshToken = parsed.searchParams.get('refresh_token');
        } catch {
          // Manual fallback URL parameter extraction if URL parser fails on custom schemes
          const codeMatch = res.url.match(/[?&]code=([^&]+)/);
          if (codeMatch) code = decodeURIComponent(codeMatch[1]);
          const tokenMatch = res.url.match(/[?&#]access_token=([^&]+)/);
          if (tokenMatch) accessToken = decodeURIComponent(tokenMatch[1]);
          const refreshMatch = res.url.match(/[?&#]refresh_token=([^&]+)/);
          if (refreshMatch) refreshToken = decodeURIComponent(refreshMatch[1]);
        }

        // Option 1: PKCE Code Exchange (Supabase JS v2 default)
        if (code) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionErr) {
            throw new Error(sessionErr.message);
          }

          if (sessionData.user && sessionData.session) {
            const user = this.mapSupabaseUser(sessionData.user);
            this.currentUser = user;
            this.notifyListeners();
            return { user, token: sessionData.session.access_token };
          }
        }

        // Option 2: Direct Token Session
        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionErr) {
            throw new Error(sessionErr.message);
          }

          if (sessionData.user && sessionData.session) {
            const user = this.mapSupabaseUser(sessionData.user);
            this.currentUser = user;
            this.notifyListeners();
            return { user, token: sessionData.session.access_token };
          }
        }
      }
    }

    // Fallback: check session state
    const { data: currentSession } = await supabase.auth.getSession();
    if (currentSession?.session?.user) {
      const user = this.mapSupabaseUser(currentSession.session.user);
      this.currentUser = user;
      this.notifyListeners();
      return { user, token: currentSession.session.access_token };
    }

    throw new Error('OAuth authentication could not be completed. Please try again.');
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
