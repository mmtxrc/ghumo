/**
 * Search & Discovery Domain Models
 * Aligned with frontend-guide.md
 */

export interface PlaceSearchQuery {
  query: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  category?: string;
  description?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  imageUrl?: string;
}

export interface ISearchService {
  searchPlaces(query: string): Promise<PlaceSearchResult[]>;
  searchPlacesStream(
    query: string,
    onProgress: (step: string) => void,
    onComplete: (results: PlaceSearchResult[]) => void,
    onError: (error: any) => void
  ): () => void;
}
