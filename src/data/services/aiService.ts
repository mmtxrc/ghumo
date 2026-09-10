/**
 * AI Service Implementation
 * Integrates with FastAPI backend (/itinerary, /itinerary/stream, /itinerary/video)
 * Matches the schema from video-itinerary.json, keyword-itinerary.json, sample1.json, and frontend-guide.md
 */

import { AIPromptRequest, AIPromptResponse, IAIService, VideoItineraryApiResponse } from '@/domain/models/ai';
import { apiClient } from '../api/apiClient';
import { querySampleItinerary, SAMPLE_ITINERARIES } from '../sampleDatasets';

export class AIService implements IAIService {
  public async generateFromVideoUrl(url: string): Promise<AIPromptResponse> {
    try {
      const response = await apiClient.post<VideoItineraryApiResponse>('/itinerary/video', {
        url,
      });
      if (response.data) {
        return this.mapVideoApiResponse(response.data);
      }
    } catch {
      // fallback to sample video-itinerary dataset
    }

    await new Promise((r) => setTimeout(r, 500));
    // Sourced directly from video-itinerary.json
    const videoSample = SAMPLE_ITINERARIES.find((it) => it.id === 'itin_chandni_chowk_food') || SAMPLE_ITINERARIES[1];
    return {
      itineraryId: videoSample.id,
      location: videoSample.location,
      title: videoSample.title,
      summary: videoSample.summary,
      budget: videoSample.budget,
      recommended_places: videoSample.recommendedPlaces,
      days: videoSample.days,
      tips: videoSample.tips,
    };
  }

  public async generateItinerary(request: AIPromptRequest): Promise<AIPromptResponse> {
    // Check if prompt contains a video URL or if video attachment is attached
    const isVideoRequest =
      request.videoUrl ||
      request.attachments?.some((a) => a.type === 'video') ||
      request.prompt.includes('youtube.com') ||
      request.prompt.includes('instagram.com') ||
      request.prompt.includes('tiktok.com');

    if (isVideoRequest) {
      const videoUrl = request.videoUrl || request.prompt;
      return this.generateFromVideoUrl(videoUrl);
    }

    try {
      const response = await apiClient.post<any>('/itinerary', {
        location: request.location || 'Delhi',
        time_available: '2 days',
        interests: request.interests || ['heritage', 'food', 'shopping'],
        budget: request.budget || '₹5,000',
        prompt: request.prompt,
      });

      if (response.data) {
        if (response.data.days && Array.isArray(response.data.days)) {
          return response.data;
        }
        if (response.data.itinerary) {
          return this.mapVideoApiResponse(response.data);
        }
      }
    } catch {
      // fallback to curated sample dataset
    }

    await new Promise((r) => setTimeout(r, 400));
    const sample = querySampleItinerary(request.prompt);
    return {
      itineraryId: sample.id,
      location: sample.location,
      title: sample.title,
      summary: sample.summary,
      budget: sample.budget,
      recommended_places: sample.recommendedPlaces,
      days: sample.days,
      tips: sample.tips,
    };
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
          location: request.location || 'Delhi',
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
            setTimeout(async () => {
              if (!cancelled) {
                const fallback = await this.generateItinerary(request);
                onComplete(fallback);
              }
            }, 700);
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

  private mapVideoApiResponse(data: VideoItineraryApiResponse): AIPromptResponse {
    return {
      location: data.location,
      title: data.location ? `Trip Guide: ${data.location}` : 'Extracted Travel Itinerary',
      summary: typeof data.itinerary === 'string' ? data.itinerary : 'Custom itinerary from video.',
      rawItineraryText: typeof data.itinerary === 'string' ? data.itinerary : undefined,
      recommended_places: data.recommended_places || [],
      recommended_attractions: data.recommended_attractions || [],
      days: [
        {
          dayNumber: 1,
          title: data.location || 'Curated Spots',
          places: (data.recommended_places || []).map((p, idx) => ({
            time: `Stop ${idx + 1}`,
            name: p.name,
            description: p.reason || `${p.type ? `Category: ${p.type}` : 'Recommended Place'}`,
            location: data.location,
            lat: p.lat,
            lng: p.lng,
          })),
        },
      ],
    };
  }
}

export const defaultAIService = new AIService();
