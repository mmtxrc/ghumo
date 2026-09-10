/**
 * AI Itinerary & Assistant Domain Models
 * Aligned with frontend-guide.md and /itinerary & /itinerary/video API schemas
 */

export interface AttachmentItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'link';
  uri?: string;
  size?: number;
}

export interface RecommendedPlace {
  name: string;
  type?: string;
  reason?: string;
  lat?: number;
  lng?: number;
  image?: {
    url?: string;
    source?: string;
    attribution?: string;
  } | null;
}

export interface AIPromptRequest {
  prompt: string;
  attachments?: AttachmentItem[];
  location?: string;
  budget?: string;
  interests?: string[];
  videoUrl?: string;
}

export interface AIPromptResponse {
  itineraryId?: string;
  location?: string;
  title: string;
  summary: string;
  rawItineraryText?: string;
  budget?: string;
  recommended_places?: RecommendedPlace[];
  recommended_attractions?: RecommendedPlace[];
  tips?: string[];
  days?: Array<{
    dayNumber: number;
    title: string;
    places: Array<{
      time: string;
      name: string;
      description: string;
      location?: string;
      lat?: number;
      lng?: number;
    }>;
  }>;
}

export interface VideoItineraryApiResponse {
  location: string;
  itinerary: string;
  recommended_places: RecommendedPlace[];
  recommended_attractions?: RecommendedPlace[];
}

export interface IAIService {
  generateItinerary(request: AIPromptRequest): Promise<AIPromptResponse>;
  generateFromVideoUrl(url: string): Promise<AIPromptResponse>;
  generateItineraryStream(
    request: AIPromptRequest,
    onProgress: (stepData: any) => void,
    onComplete: (itinerary: AIPromptResponse) => void,
    onError: (error: any) => void
  ): () => void;
}
