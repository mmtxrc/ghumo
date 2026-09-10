/**
 * API Client for Ghumo Backend
 * Configured per frontend-guide.md & Ghumo API Docs
 * - Base URL: http://127.0.0.1:8000 (Overridable via EXPO_PUBLIC_API_URL)
 * - Injects Auth Bearer Token into headers
 * - Supports standard REST and SSE (Server-Sent Events) streaming (/search/stream, /itinerary/stream)
 * - Smooth transition delay for fast cached responses
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface StreamEvent {
  event: 'progress' | 'complete' | 'error';
  data: any;
}

const getDynamicApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:8000';
  }
  // Dynamically derive dev computer IP from Expo Metro host URI
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:8000`;
    }
  }
  return 'http://127.0.0.1:8000';
};

class ApiClient {
  private baseUrl: string = getDynamicApiUrl();
  private tokenGetter: (() => Promise<string | null>) | null = null;
  private activeSearchController: AbortController | null = null;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  public cancelPendingSearch() {
    if (this.activeSearchController) {
      this.activeSearchController.abort();
      this.activeSearchController = null;
    }
  }

  public setAuthTokenGetter(getter: () => Promise<string | null>) {
    this.tokenGetter = getter;
  }

  private async getHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.tokenGetter) {
      try {
        const token = await this.tokenGetter();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        logger.warn('ApiClient', 'Failed to acquire auth token for request', err);
      }
    }

    return headers;
  }

  private async ensureMinDelay<T>(promise: Promise<T>, minMs: number = 300): Promise<T> {
    const start = Date.now();
    const result = await promise;
    const elapsed = Date.now() - start;
    if (elapsed < minMs) {
      await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
    }
    return result;
  }

  public async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    logger.api('GET', url);
    const headers = await this.getHeaders();
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers,
    }).then(async (response) => {
      if (!response.ok) {
        logger.error('API', `GET ${url} failed with status ${response.status}`);
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      logger.api('GET', url, response.status);
      return { data, status: response.status };
    });

    return this.ensureMinDelay(fetchPromise, 350);
  }

  public async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    logger.api('POST', url, undefined, body);
    const headers = await this.getHeaders();

    const fetchPromise = fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }).then(async (response) => {
      if (!response.ok) {
        logger.error('API', `POST ${url} failed with status ${response.status}`);
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      logger.api('POST', url, response.status);
      return { data, status: response.status };
    });

    return this.ensureMinDelay(fetchPromise, 350);
  }

  public async streamEvents(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST';
      body?: any;
      onProgress?: (progressData: any) => void;
      onComplete?: (finalData: any) => void;
      onError?: (error: any) => void;
    }
  ): Promise<() => void> {
    const { method = 'GET', body, onProgress, onComplete, onError } = options;
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders({
      Accept: 'text/event-stream',
    });

    const controller = new AbortController();

    fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Stream error: ${response.statusText}`);
        }
        if (!response.body) {
          throw new Error('Response body does not support streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim().startsWith('data:')) {
              try {
                const dataJson = JSON.parse(line.replace(/^data:\s*/, ''));
                if (onProgress) onProgress(dataJson);
              } catch {
                if (onProgress) onProgress(line);
              }
            } else if (line.trim().startsWith('event: complete')) {
              if (onComplete) onComplete(line);
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && onError) {
          onError(err);
        }
      });

    return () => controller.abort();
  }
}

export const apiClient = new ApiClient();
