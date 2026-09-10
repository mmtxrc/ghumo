/**
 * AI Service Implementation
 * Integrates with FastAPI backend (/itinerary, /itinerary/stream)
 */

import { AIPromptRequest, AIPromptResponse, IAIService } from '@/domain/models/ai';
import { apiClient } from '../api/apiClient';

export class AIService implements IAIService {
  public async generateItinerary(request: AIPromptRequest): Promise<AIPromptResponse> {
    try {
      const response = await apiClient.post<AIPromptResponse>('/itinerary', {
        location: request.location || 'Jaipur',
        time_available: '3 days',
        interests: request.interests || ['heritage', 'food'],
        budget: request.budget || 'moderate',
        prompt: request.prompt,
      });
      return response.data;
    } catch {
      // Fallback AI simulation
      await new Promise((r) => setTimeout(r, 600));
      return {
        itineraryId: `itin_${Date.now()}`,
        title: `Custom Itinerary: ${request.prompt.slice(0, 30)}...`,
        summary: 'AI curated travel plan crafted for your preferences.',
        days: [
          {
            dayNumber: 1,
            title: 'Heritage & Local Culture',
            places: [
              { time: '09:00 AM', name: 'Historic Amber Fort', description: 'Morning hilltop fort exploration.' },
              { time: '02:00 PM', name: 'City Palace & Museum', description: 'Royal courtyards and art exhibits.' },
            ],
          },
        ],
      };
    }
  }

  public generateItineraryStream(
    request: AIPromptRequest,
    onProgress: (stepData: any) => void,
    onComplete: (itinerary: AIPromptResponse) => void,
    onError: (error: any) => void
  ): () => void {
    let cancelled = false;

    apiClient
      .streamEvents('/itinerary/stream', {
        method: 'POST',
        body: {
          location: request.location || 'Rajasthan',
          prompt: request.prompt,
        },
        onProgress: (data) => {
          if (!cancelled) onProgress(data);
        },
        onComplete: (data) => {
          if (!cancelled) onComplete(data);
        },
        onError: (err) => {
          if (!cancelled) {
            onProgress({ step: 'Synthesizing travel insights...' });
            setTimeout(() => {
              if (!cancelled) {
                onComplete({
                  title: 'AI Curated Journey',
                  summary: 'Handcrafted itinerary tailored for your prompt.',
                });
              }
            }, 800);
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

export const defaultAIService = new AIService();
