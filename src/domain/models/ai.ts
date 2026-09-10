/**
 * AI Itinerary & Assistant Domain Models
 * Aligned with frontend-guide.md
 */

export interface AttachmentItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'link';
  uri?: string;
  size?: number;
}

export interface AIPromptRequest {
  prompt: string;
  attachments?: AttachmentItem[];
  location?: string;
  budget?: string;
  interests?: string[];
}

export interface AIPromptResponse {
  itineraryId?: string;
  title: string;
  summary: string;
  days?: Array<{
    dayNumber: number;
    title: string;
    places: Array<{
      time: string;
      name: string;
      description: string;
      location?: string;
    }>;
  }>;
}

export interface IAIService {
  generateItinerary(request: AIPromptRequest): Promise<AIPromptResponse>;
  generateItineraryStream(
    request: AIPromptRequest,
    onProgress: (stepData: any) => void,
    onComplete: (itinerary: AIPromptResponse) => void,
    onError: (error: any) => void
  ): () => void;
}
