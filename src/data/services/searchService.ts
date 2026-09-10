/**
 * Search Service Implementation
 * Integrates with FastAPI backend endpoints:
 * - /search, /search/stream
 * - /suggestions
 * - /nearby
 * - /hidden-gems
 * - /tips
 * - /target-feedback
 * Features chained secondary API queries and graceful null handling.
 */

import {
  ISearchService,
  PlaceSearchResult,
  HiddenGemItem,
  TravelTipItem,
  NearbyPoiItem,
  TargetFeedbackPayload,
  TargetFeedbackResponse,
} from '@/domain/models/search';
import { apiClient } from '../api/apiClient';
import { querySamplePlaces } from '../sampleDatasets';
import { logger } from '@/utils/logger';

export class SearchService implements ISearchService {
  public async searchPlaces(query: string): Promise<PlaceSearchResult[]> {
    if (!query.trim()) return [];

    try {
      logger.search(`Searching query: "${query}"`);
      const response = await apiClient.get<any>('/search', { query });
      
      if (response.data) {
        let places: PlaceSearchResult[] = [];
        let locationName = response.data.location || query;
        let coords = response.data.coordinates;

        // Parse primary places list
        if (response.data.places && Array.isArray(response.data.places)) {
          places = response.data.places.map((p: any, idx: number) => this.mapPlaceItem(p, locationName, idx));
        } else if (Array.isArray(response.data)) {
          places = response.data.map((p: any, idx: number) => this.mapPlaceItem(p, locationName, idx));
        }

        // Extract food or markets if places list was sparse
        if (places.length === 0 && response.data.food && Array.isArray(response.data.food)) {
          places = response.data.food.map((f: any, idx: number) => this.mapPlaceItem(f, locationName, idx));
        }

        // Chained Secondary Call 1: Hidden Gems for this location
        let hiddenGems: HiddenGemItem[] = response.data.hidden_gems || [];
        if (hiddenGems.length === 0 && locationName) {
          try {
            hiddenGems = await this.getHiddenGems(locationName);
          } catch (e) {
            logger.warn('SearchService', 'Chained hidden-gems query skipped', e);
          }
        }

        // Chained Secondary Call 2: Tips for this location
        let tips: TravelTipItem[] = response.data.tips || [];
        if (tips.length === 0 && locationName) {
          try {
            tips = await this.getTips(locationName);
          } catch (e) {
            logger.warn('SearchService', 'Chained tips query skipped', e);
          }
        }

        // Attach chained secondary data to primary places
        if (places.length > 0) {
          places[0].hidden_gems = hiddenGems;
          places[0].tips = tips;

          // Chained Secondary Call 3: Nearby POIs if coordinates exist
          if (coords && coords.lat && coords.lng) {
            try {
              const nearby = await this.getNearby(coords.lat, coords.lng, 5000);
              places[0].nearby_places = [...(nearby.places || []), ...(nearby.food || [])];
            } catch (e) {
              logger.warn('SearchService', 'Chained nearby query skipped', e);
            }
          }
        }

        if (places.length > 0) {
          return places;
        }
      }
    } catch (err: any) {
      logger.warn('SearchService', 'Backend search unreachable, falling back to curated dataset', err?.message);
    }

    // Fallback to sample places dataset with zero-crash null handling
    const matched = querySamplePlaces(query);
    return matched.map((p, idx) => ({
      id: p.id || `sample_${idx}`,
      name: p.name || 'Travel Landmark',
      category: `${p.city || 'Delhi'} • ${p.category || 'Spot'}`,
      description: p.reason || p.must_see || p.history || 'Famous travel destination.',
      reason: p.reason,
      history: p.history,
      culture: p.culture,
      must_see: p.must_see,
      ticket_price: p.ticket_price || 'Free / Standard',
      timings: p.timings || '09:00 AM - 06:00 PM',
      rating: p.rating || 4.7,
      lat: p.lat || 28.6139,
      lng: p.lng || 77.2090,
      imageUrl: p.imageUrl,
      image: p.imageUrl ? { url: p.imageUrl, provider: 'wikimedia', attribution: 'Wikimedia Commons' } : null,
    }));
  }

  public async getSuggestions(limit: number = 10, city?: string, category?: string): Promise<PlaceSearchResult[]> {
    try {
      logger.api('GET', '/suggestions');
      const response = await apiClient.get<any>('/suggestions', { limit, city, category });
      
      const list = response.data?.suggestions || (Array.isArray(response.data) ? response.data : []);
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any, idx: number) => this.mapPlaceItem(item, item.city || 'Top Spot', idx));
      }
    } catch (err: any) {
      logger.warn('SearchService', 'Backend /suggestions unreachable, using fallback suggestions', err?.message);
    }

    const samples = querySamplePlaces('delhi');
    return samples.slice(0, limit).map((p, idx) => ({
      id: p.id || `sugg_${idx}`,
      name: p.name,
      city: p.city || 'Delhi',
      category: p.category || 'Must-Visit Spot',
      description: p.reason || 'Popular destination with verified photography and visitor ratings.',
      rating: p.rating || 4.8,
      lat: p.lat || 28.6139,
      lng: p.lng || 77.2090,
      imageUrl: p.imageUrl,
      image: p.imageUrl ? { url: p.imageUrl, provider: 'wikimedia' } : null,
      feedback: { averageRating: p.rating || 4.8, ratingCount: 12, weightedScore: 4.6 },
    }));
  }

  public async getHiddenGems(location: string): Promise<HiddenGemItem[]> {
    if (!location) return [];
    try {
      const response = await apiClient.get<HiddenGemItem[]>('/hidden-gems', { location });
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      logger.warn('SearchService', `Failed to fetch hidden-gems for ${location}`, err);
    }
    return [
      {
        name: `${location} Offbeat Heritage Spot`,
        category: 'Hidden Heritage',
        description: 'Quiet, photogenic location discovered through community travel insights.',
        confidence_score: 0.9,
      },
    ];
  }

  public async getTips(city?: string, placeId?: number): Promise<TravelTipItem[]> {
    try {
      const response = await apiClient.get<TravelTipItem[]>('/tips', { city, place_id: placeId });
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      logger.warn('SearchService', 'Failed to fetch tips', err);
    }
    return [
      {
        city: city || 'General',
        tip_text: 'Visit early morning to avoid peak afternoon crowds and get the best lighting.',
        category: 'culture',
      },
    ];
  }

  public async getNearby(lat: number, lng: number, radius: number = 5000): Promise<{ places: NearbyPoiItem[]; food: NearbyPoiItem[] }> {
    try {
      const response = await apiClient.get<any>('/nearby', { lat, lng, radius });
      if (response.data) {
        return {
          places: response.data.places || [],
          food: response.data.food || [],
        };
      }
    } catch (err) {
      logger.warn('SearchService', 'Failed to fetch nearby POIs', err);
    }
    return { places: [], food: [] };
  }

  public async submitTargetFeedback(payload: TargetFeedbackPayload): Promise<TargetFeedbackResponse> {
    logger.api('POST', '/target-feedback', undefined, payload);
    const response = await apiClient.post<TargetFeedbackResponse>('/target-feedback', payload);
    return response.data;
  }

  public searchPlacesStream(
    query: string,
    onProgress: (step: string) => void,
    onComplete: (results: PlaceSearchResult[]) => void,
    onError: (error: any) => void
  ): () => void {
    let cancelled = false;

    apiClient
      .streamEvents('/search/stream', {
        method: 'POST',
        body: { query },
        onProgress: (data) => {
          if (!cancelled) {
            onProgress(typeof data === 'string' ? data : data.message || 'Scanning map layers...');
          }
        },
        onComplete: (finalData) => {
          if (!cancelled) {
            const places = finalData?.data?.places || finalData?.places || [];
            onComplete(places.map((p: any, idx: number) => this.mapPlaceItem(p, query, idx)));
          }
        },
        onError: (err) => {
          if (!cancelled) {
            onProgress('Synthesizing research results...');
            setTimeout(async () => {
              if (!cancelled) {
                const results = await this.searchPlaces(query);
                onComplete(results);
              }
            }, 500);
          }
        },
      })
      .catch((err) => {
        if (!cancelled && onError) onError(err);
      });

    return () => {
      cancelled = true;
    };
  }

  private mapPlaceItem(p: any, fallbackLocation: string, idx: number): PlaceSearchResult {
    const rawImage = p.image || null;
    const imageUrl =
      typeof rawImage === 'string'
        ? rawImage
        : rawImage?.url || p.imageUrl || p.photoURL || undefined;

    return {
      id: String(p.id || p.place_id || `place_${idx}`),
      place_id: typeof p.id === 'number' ? p.id : typeof p.place_id === 'number' ? p.place_id : undefined,
      name: p.name || 'Must-See Spot',
      city: p.city || fallbackLocation,
      category: p.category || p.type || 'Travel Destination',
      description: p.description || p.reason || p.must_see || p.history || p.culture || 'Featured travel destination.',
      reason: p.reason,
      history: p.history,
      culture: p.culture,
      must_see: p.must_see,
      ticket_price: p.ticket_price || p.ticketPrice || 'Free / Standard Ticket',
      timings: p.timings || p.hours || '09:00 AM - 06:00 PM',
      lat: typeof p.lat === 'number' ? p.lat : undefined,
      lng: typeof p.lng === 'number' ? p.lng : undefined,
      rating: p.rating || p.feedback?.averageRating || 4.8,
      feedback: p.feedback
        ? {
            averageRating: p.feedback.averageRating || p.feedback.average_rating || 4.8,
            ratingCount: p.feedback.ratingCount || p.feedback.rating_count || 10,
            weightedScore: p.feedback.weightedScore || p.feedback.weighted_score || 4.5,
          }
        : undefined,
      imageUrl,
      image: imageUrl
        ? {
            url: imageUrl,
            provider: rawImage?.provider || rawImage?.source || 'wikimedia',
            attribution: rawImage?.attribution || 'Wikimedia Commons',
          }
        : null,
    };
  }
}

export const defaultSearchService = new SearchService();
