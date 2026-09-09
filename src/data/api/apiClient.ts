/**
 * API Client for Ghumo Backend
 * Configured per frontend-guide.md
 * - Base URL: http://localhost:8000
 * - Injects Firebase Bearer Token into headers
 * - Supports standard REST and SSE (Server-Sent Events) streaming for AI endpoints (/search/stream, /itinerary/stream)
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface StreamEvent {
  event: 'progress' | 'complete' | 'error';
  data: any;
}

class ApiClient {
  private baseUrl: string = 'http://localhost:8000';
  private tokenGetter: (() => Promise<string | null>) | null = null;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  /**
   * Register a token supplier (e.g. from Firebase Auth)
   */
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
        console.warn('[ApiClient] Failed to acquire auth token for request', err);
      }
    }

    return headers;
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

    const headers = await this.getHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, status: response.status };
  }

  public async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, status: response.status };
  }

  /**
   * Helper for SSE streaming endpoints (/search/stream, /itinerary/stream)
   * Uses fetch + ReadableStream reader
   */
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
