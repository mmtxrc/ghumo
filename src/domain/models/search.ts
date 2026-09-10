/**
 * Search & Discovery Domain Models
 * Aligned with frontend-guide.md and /search & /search/stream API schemas
 */

export interface PlaceSearchQuery {
  query: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface PlaceImage {
  url?: string;
  source?: string;
  attribution?: string;
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  category?: string;
  description?: string;
  reason?: string;
  history?: string;
  culture?: string;
  must_see?: string;
  ticket_price?: string;
  timings?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  imageUrl?: string;
  image?: PlaceImage | null;
}

export interface SearchApiResponse {
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  places: PlaceSearchResult[];
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
