/**
 * Search Service Implementation
 * Integrates with FastAPI backend (/search, /search/stream)
 * Matches the schema from output-w-image.json and frontend-guide.md
 */

import { ISearchService, PlaceSearchResult, SearchApiResponse } from '@/domain/models/search';
import { apiClient } from '../api/apiClient';
import { querySamplePlaces } from '../sampleDatasets';

export class SearchService implements ISearchService {
  public async searchPlaces(query: string): Promise<PlaceSearchResult[]> {
    if (!query.trim()) return [];

    try {
      const response = await apiClient.get<any>('/search', { query });
      if (response.data) {
        // Check if response is { location, coordinates, places: [...] } as in output-w-image.json
        if (response.data.places && Array.isArray(response.data.places)) {
          return response.data.places.map((p: any, idx: number) => ({
            id: p.id || `place_${idx}`,
            name: p.name,
            category: p.category || (response.data.location ? `${response.data.location}` : 'Heritage Spot'),
            description: p.reason || p.must_see || p.history || p.culture || '',
            reason: p.reason,
            history: p.history,
            culture: p.culture,
            must_see: p.must_see,
            ticket_price: p.ticket_price,
            timings: p.timings,
            rating: p.rating || 4.8,
            lat: p.lat,
            lng: p.lng,
            image: p.image,
            imageUrl: p.image?.url || p.imageUrl,
          }));
        }
        // Direct array format
        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      }
    } catch {
      // fallback to curated sample dataset
    }

    await new Promise((r) => setTimeout(r, 200));
    const matched = querySamplePlaces(query);
    return matched.map((p) => ({
      id: p.id,
      name: p.name,
      category: `${p.city} • ${p.category}`,
      description: p.reason || p.must_see || p.history || '',
      reason: p.reason,
      history: p.history,
      culture: p.culture,
      must_see: p.must_see,
      ticket_price: p.ticket_price,
      timings: p.timings,
      rating: p.rating || 4.8,
      lat: p.lat || 28.6139,
      lng: p.lng || 77.2090,
      imageUrl: p.imageUrl,
      image: p.imageUrl ? { url: p.imageUrl, source: 'wikimedia' } : null,
    }));
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
            onProgress(typeof data === 'string' ? data : data.message || 'Searching places...');
          }
        },
        onComplete: (finalData) => {
          if (!cancelled) {
            const places = finalData?.data?.places || finalData?.places || finalData?.results || [];
            onComplete(places);
          }
        },
        onError: (err) => {
          if (!cancelled) {
            onProgress('Synthesizing results...');
            setTimeout(async () => {
              if (!cancelled) {
                const results = await this.searchPlaces(query);
                onComplete(results);
              }
            }, 600);
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
}

export const defaultSearchService = new SearchService();
