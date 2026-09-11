/**
 * Local Caching Service for Ghumo
 * Persists the last 5 searches and AI prompts with a 60-minute TTL.
 * Automatically checks timestamp validity and supports manual refetch triggers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchCategorizedData } from '@/domain/models/search';
import { AIPromptResponse } from '@/domain/models/ai';
import { logger } from '@/utils/logger';

const SEARCH_CACHE_KEY = '@ghumo_recent_searches_cache_v1';
const PROMPT_CACHE_KEY = '@ghumo_recent_prompts_cache_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 Minutes in milliseconds
const MAX_CACHE_ITEMS = 5;

export interface CachedSearchItem {
  query: string;
  data: SearchCategorizedData;
  timestamp: number;
}

export interface CachedPromptItem {
  prompt: string;
  response: AIPromptResponse;
  timestamp: number;
}

class CacheService {
  /**
   * Retrieve cached search result if under 60 minutes old
   */
  public async getCachedSearch(query: string): Promise<{ data: SearchCategorizedData; isExpired: boolean } | null> {
    try {
      const q = query.trim().toLowerCase();
      const raw = await AsyncStorage.getItem(SEARCH_CACHE_KEY);
      if (!raw) return null;

      const list: CachedSearchItem[] = JSON.parse(raw);
      const item = list.find((i) => i.query.toLowerCase() === q);
      if (!item) return null;

      const isExpired = Date.now() - item.timestamp > CACHE_TTL_MS;
      return { data: item.data, isExpired };
    } catch (err: any) {
      logger.warn('CacheService', 'Failed to get cached search', err?.message);
      return null;
    }
  }

  /**
   * Save search result to local cache (last 5 items, deduped)
   */
  public async saveCachedSearch(query: string, data: SearchCategorizedData): Promise<void> {
    try {
      const q = query.trim();
      const raw = await AsyncStorage.getItem(SEARCH_CACHE_KEY);
      let list: CachedSearchItem[] = raw ? JSON.parse(raw) : [];

      list = [
        { query: q, data, timestamp: Date.now() },
        ...list.filter((i) => i.query.toLowerCase() !== q.toLowerCase()),
      ].slice(0, MAX_CACHE_ITEMS);

      await AsyncStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(list));
    } catch (err: any) {
      logger.warn('CacheService', 'Failed to save cached search', err?.message);
    }
  }

  /**
   * Retrieve cached AI prompt result if under 60 minutes old
   */
  public async getCachedPrompt(prompt: string): Promise<{ response: AIPromptResponse; isExpired: boolean } | null> {
    try {
      const p = prompt.trim().toLowerCase();
      const raw = await AsyncStorage.getItem(PROMPT_CACHE_KEY);
      if (!raw) return null;

      const list: CachedPromptItem[] = JSON.parse(raw);
      const item = list.find((i) => i.prompt.toLowerCase() === p);
      if (!item) return null;

      const isExpired = Date.now() - item.timestamp > CACHE_TTL_MS;
      return { response: item.response, isExpired };
    } catch (err: any) {
      logger.warn('CacheService', 'Failed to get cached prompt', err?.message);
      return null;
    }
  }

  /**
   * Save AI prompt result to local cache (last 5 items, deduped)
   */
  public async saveCachedPrompt(prompt: string, response: AIPromptResponse): Promise<void> {
    try {
      const p = prompt.trim();
      const raw = await AsyncStorage.getItem(PROMPT_CACHE_KEY);
      let list: CachedPromptItem[] = raw ? JSON.parse(raw) : [];

      list = [
        { prompt: p, response, timestamp: Date.now() },
        ...list.filter((i) => i.prompt.toLowerCase() !== p.toLowerCase()),
      ].slice(0, MAX_CACHE_ITEMS);

      await AsyncStorage.setItem(PROMPT_CACHE_KEY, JSON.stringify(list));
    } catch (err: any) {
      logger.warn('CacheService', 'Failed to save cached prompt', err?.message);
    }
  }

  /**
   * Load history query strings
   */
  public async getRecentSearches(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(SEARCH_CACHE_KEY);
      if (!raw) return [];
      const list: CachedSearchItem[] = JSON.parse(raw);
      return list.map((i) => i.query);
    } catch {
      return [];
    }
  }

  public async getRecentPrompts(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(PROMPT_CACHE_KEY);
      if (!raw) return [];
      const list: CachedPromptItem[] = JSON.parse(raw);
      return list.map((i) => i.prompt);
    } catch {
      return [];
    }
  }
}

export const cacheService = new CacheService();
