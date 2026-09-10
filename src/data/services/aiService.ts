/**
 * AI Service Implementation
 * Integrates with FastAPI backend endpoints:
 * - /itinerary (POST)
 * - /itinerary/stream (POST SSE)
 * - /itinerary/video (POST)
 * Supports prompt parsing, YouTube video extraction, markdown tables, and budget breakdowns.
 */

import {
  AIPromptRequest,
  AIPromptResponse,
  IAIService,
  VideoItineraryApiResponse,
} from '@/domain/models/ai';
import { apiClient } from '../api/apiClient';
import { querySampleItinerary, SAMPLE_ITINERARIES } from '../sampleDatasets';
import { logger } from '@/utils/logger';

export class AIService implements IAIService {
  public async generateFromVideoUrl(url: string): Promise<AIPromptResponse> {
    logger.api('POST', '/itinerary/video', undefined, { url });
    try {
      const response = await apiClient.post<VideoItineraryApiResponse>('/itinerary/video', { url });
      if (response.data) {
        return this.mapVideoApiResponse(response.data);
      }
    } catch (err: any) {
      logger.warn('AIService', 'Backend /itinerary/video error, using fallback sample', err?.message);
    }

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
    // Detect YouTube video link in prompt or attachments
    const youtubeUrlMatch = request.prompt.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/i);
    const isVideoRequest =
      Boolean(youtubeUrlMatch) ||
      request.videoUrl ||
      request.attachments?.some((a) => a.type === 'video');

    if (isVideoRequest) {
      const extractedUrl = youtubeUrlMatch ? youtubeUrlMatch[0] : request.videoUrl || request.prompt;
      logger.auth(`Video URL detected in prompt: ${extractedUrl}`);
      return this.generateFromVideoUrl(extractedUrl);
    }

    try {
      logger.api('POST', '/itinerary', undefined, { prompt: request.prompt });
      const response = await apiClient.post<any>('/itinerary', {
        prompt: request.prompt,
        location: request.location || undefined,
        interests: request.interests || undefined,
        budget: request.budget || undefined,
      });

      if (response.data) {
        return this.mapBackendItineraryResponse(response.data, request.prompt);
      }
    } catch (err: any) {
      logger.warn('AIService', 'Backend /itinerary error, using fallback sample', err?.message);
    }

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

    // Detect YouTube video link
    const youtubeUrlMatch = request.prompt.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/i);
    if (youtubeUrlMatch) {
      onProgress({ step: 'video_parsing', message: 'Extracting itinerary from YouTube Vlog...' });
      this.generateFromVideoUrl(youtubeUrlMatch[0])
        .then((res) => {
          if (!cancelled) onComplete(res);
        })
        .catch((err) => {
          if (!cancelled && onError) onError(err);
        });
      return () => {
        cancelled = true;
      };
    }

    apiClient
      .streamEvents('/itinerary/stream', {
        method: 'POST',
        body: {
          prompt: request.prompt,
          location: request.location,
        },
        onProgress: (data) => {
          if (!cancelled) {
            onProgress(typeof data === 'string' ? { message: data } : data);
          }
        },
        onComplete: (data) => {
          if (!cancelled) {
            const mapped = this.mapBackendItineraryResponse(data?.data || data, request.prompt);
            onComplete(mapped);
          }
        },
        onError: (err) => {
          if (!cancelled) {
            onProgress({ step: 'ai_generation', message: 'Synthesizing itinerary...' });
            setTimeout(async () => {
              if (!cancelled) {
                const fallback = await this.generateItinerary(request);
                onComplete(fallback);
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

  private mapBackendItineraryResponse(data: any, originalPrompt: string): AIPromptResponse {
    const loc = data.location || data.plan?.destination || 'Destination';
    const plan = data.plan || {};
    const markdownTable = plan.markdown_table || data.markdown_table || undefined;
    const budgetBreakdown = plan.budget_breakdown || data.budget_breakdown || undefined;
    const parsedReqs = data.parsed_requirements || undefined;
    const mode = plan.mode || parsedReqs?.mode || 'day_wise';

    let days: any[] = [];
    if (plan.days && Array.isArray(plan.days)) {
      days = plan.days.map((d: any, idx: number) => ({
        dayNumber: d.day || idx + 1,
        title: d.title || `Day ${d.day || idx + 1}`,
        stay_recommendation: d.stay_recommendation || undefined,
        estimated_day_cost: d.estimated_day_cost || undefined,
        activities: (d.activities || []).map((a: any) => ({
          time: a.time_slot || a.time || 'Scheduled Spot',
          name: a.place || a.name || 'Landmark',
          description: a.purpose || a.description || 'Sightseeing & exploration.',
          duration: a.duration,
          cost_estimate: a.cost_estimate,
          image: a.image || null,
        })),
      }));
    } else if (data.days && Array.isArray(data.days)) {
      days = data.days;
    }

    return {
      location: loc,
      title: `${mode === 'time_wise' ? 'Time-Wise' : 'Day-Wise'} Itinerary: ${loc}`,
      summary: plan.summary || (typeof data.itinerary === 'string' ? data.itinerary : `Custom travel plan for ${loc}.`),
      rawItineraryText: typeof data.itinerary === 'string' ? data.itinerary : undefined,
      markdown_table: markdownTable,
      budget: plan.estimated_total_budget || parsedReqs?.budget || data.budget || 'Flexible Budget',
      budget_breakdown: budgetBreakdown,
      parsed_requirements: parsedReqs,
      segregation_mode: mode,
      recommended_places: (data.recommended_places || []).map((p: any) => ({
        name: typeof p === 'string' ? p : p.name,
        type: p.type || 'Recommended Spot',
        reason: p.reason || p.description,
        lat: p.lat,
        lng: p.lng,
        image: p.image || null,
      })),
      recommended_attractions: data.recommended_attractions || [],
      days: days.length > 0 ? days : undefined,
    };
  }

  private mapVideoApiResponse(data: VideoItineraryApiResponse): AIPromptResponse {
    return {
      location: data.location || 'Vlog Destination',
      title: data.location ? `YouTube Vlog Itinerary: ${data.location}` : 'Extracted Travel Itinerary',
      summary: typeof data.itinerary === 'string' ? data.itinerary : 'Custom itinerary extracted from video vlog.',
      rawItineraryText: typeof data.itinerary === 'string' ? data.itinerary : undefined,
      recommended_places: data.recommended_places || [],
      recommended_attractions: data.recommended_attractions || [],
      days: [
        {
          dayNumber: 1,
          title: data.location || 'Curated Spots',
          activities: (data.recommended_places || []).map((p, idx) => ({
            time: `Stop ${idx + 1}`,
            name: p.name,
            description: p.reason || `${p.type ? `Category: ${p.type}` : 'Featured Place'}`,
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
