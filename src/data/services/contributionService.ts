/**
 * Contribution & Feedback Service
 * Manages Single Active Rating Per User (TargetFeedback) both locally in AsyncStorage
 * and synchronized with backend (/target-feedback & /contributions).
 *
 * Enforces unique constraint: (user_id_or_anon, target_type, target_id).
 * Upserts locally and syncs with the server.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TargetFeedbackPayload, TargetFeedbackResponse } from '@/domain/models/search';
import { defaultSearchService } from './searchService';
import { apiClient } from '../api/apiClient';
import { logger } from '@/utils/logger';

const CONTRIBUTIONS_STORAGE_KEY = '@ghumo_user_contributions_v1';

export interface UserTargetFeedback {
  user_id_or_anon: string;
  target_type: 'place' | 'itinerary';
  target_id: string;
  rating: number;
  updated_at: string;
}

class ContributionService {
  /**
   * Save or update rating locally and sync to backend
   */
  public async submitRating(
    targetId: string,
    rating: number,
    targetType: 'place' | 'itinerary' = 'place',
    userIdOrAnon: string = 'anon_traveler'
  ): Promise<TargetFeedbackResponse | null> {
    try {
      const now = new Date().toISOString();
      const raw = await AsyncStorage.getItem(CONTRIBUTIONS_STORAGE_KEY);
      let list: UserTargetFeedback[] = raw ? JSON.parse(raw) : [];

      // Upsert behavior: single active rating per user per target
      const existingIdx = list.findIndex(
        (item) =>
          item.user_id_or_anon === userIdOrAnon &&
          item.target_type === targetType &&
          item.target_id === targetId
      );

      if (existingIdx >= 0) {
        list[existingIdx].rating = rating;
        list[existingIdx].updated_at = now;
      } else {
        list.push({
          user_id_or_anon: userIdOrAnon,
          target_type: targetType,
          target_id: targetId,
          rating,
          updated_at: now,
        });
      }

      await AsyncStorage.setItem(CONTRIBUTIONS_STORAGE_KEY, JSON.stringify(list));
      logger.app(`[CONTRIBUTIONS] Upserted local rating: ${rating}★ for ${targetType} ${targetId}`);

      // Sync with server /target-feedback & /contributions
      const payload: TargetFeedbackPayload = {
        user_id_or_anon: userIdOrAnon,
        target_type: targetType,
        target_id: targetId,
        rating,
      };

      try {
        // Try standard target-feedback endpoint
        return await defaultSearchService.submitTargetFeedback(payload);
      } catch (err) {
        try {
          // Fallback to /contributions if backend mounts it
          const res = await apiClient.post<TargetFeedbackResponse>('/contributions', payload);
          return res.data;
        } catch {
          logger.warn('ContributionService', 'Server sync offline; saved to local contributions.');
          return {
            status: 'saved_locally',
            target_type: targetType,
            target_id: targetId,
            average_rating: rating,
            rating_count: 1,
            weighted_score: rating,
          };
        }
      }
    } catch (err: any) {
      logger.error('ContributionService', 'Failed to save contribution rating', err?.message);
      return null;
    }
  }

  /**
   * Fetch all ratings saved locally for the given user/anon
   * Returns a map of target_id -> rating
   */
  public async getUserRatingsMap(userIdOrAnon: string = 'anon_traveler'): Promise<Record<string, number>> {
    try {
      const raw = await AsyncStorage.getItem(CONTRIBUTIONS_STORAGE_KEY);
      if (!raw) return {};

      const list: UserTargetFeedback[] = JSON.parse(raw);
      const map: Record<string, number> = {};

      list.forEach((item) => {
        if (!userIdOrAnon || item.user_id_or_anon === userIdOrAnon) {
          map[item.target_id] = item.rating;
        }
      });

      return map;
    } catch {
      return {};
    }
  }

  /**
   * Get list of all user contributions (places & itineraries)
   */
  public async getAllContributions(userIdOrAnon: string = 'anon_traveler'): Promise<UserTargetFeedback[]> {
    try {
      const raw = await AsyncStorage.getItem(CONTRIBUTIONS_STORAGE_KEY);
      if (!raw) return [];
      const list: UserTargetFeedback[] = JSON.parse(raw);
      return list.filter((i) => !userIdOrAnon || i.user_id_or_anon === userIdOrAnon);
    } catch {
      return [];
    }
  }
}

export const contributionService = new ContributionService();
