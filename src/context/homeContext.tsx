import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import * as Location from 'expo-location';
import { PlaceSearchResult, ISearchService, SearchCategorizedData, HiddenGemItem, TravelTipItem, NearbyPoiItem } from '@/domain/models/search';
import { AttachmentItem, AIPromptResponse, IAIService } from '@/domain/models/ai';
import { defaultSearchService } from '@/data/services/searchService';
import { defaultAIService } from '@/data/services/aiService';
import { logger } from '@/utils/logger';

export type HomeInteractionMode = 'search' | 'ai';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

interface HomeContextType {
  activeMode: HomeInteractionMode;
  isExpanded: boolean;
  searchQuery: string;
  aiPrompt: string;
  attachments: AttachmentItem[];
  isSearching: boolean;
  isLoadingSuggestions: boolean;
  isProcessingAI: boolean;
  suggestions: PlaceSearchResult[];
  searchResults: PlaceSearchResult[];
  categorizedResults: SearchCategorizedData | null;
  activeMapCategory: string;
  searchHistory: string[];
  promptHistory: string[];
  hiddenGems: HiddenGemItem[];
  tips: TravelTipItem[];
  nearbyPlaces: NearbyPoiItem[];
  aiResponse: AIPromptResponse | null;
  statusMessage: string | null;
  userLocation: UserLocation | null;
  selectedPlaceId: string | null;
  isMapVisible: boolean;
  setIsMapVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  toggleMapVisible: () => void;
  setActiveMode: (mode: HomeInteractionMode) => void;
  setIsExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  setSearchQuery: (q: string) => void;
  setAiPrompt: (p: string) => void;
  clearSearchQuery: () => void;
  clearAiPrompt: () => void;
  setActiveMapCategory: (category: string) => void;
  addAttachment: (item: AttachmentItem) => void;
  removeAttachment: (id: string) => void;
  loadSuggestions: () => Promise<void>;
  performSearch: (query?: string) => Promise<void>;
  submitAIPrompt: (prompt?: string) => Promise<void>;
  submitPlaceRating: (targetId: string, rating: number, targetType?: 'place' | 'itinerary') => Promise<void>;
  clearResults: () => void;
  requestUserLocation: () => Promise<void>;
  setSelectedPlaceId: (id: string | null) => void;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

interface HomeProviderProps {
  children: React.ReactNode;
  searchService?: ISearchService;
  aiService?: IAIService;
}

const DEFAULT_SEARCH_HISTORY = [
  'Hauz Khas',
  'Chandni Chowk',
  'Connaught Place',
  'Lodi Gardens',
  'Qutub Minar',
];

const DEFAULT_PROMPT_HISTORY = [
  '3-Day Royal Heritage in Jaipur covering forts and food',
  'Scenic lakeside cafes and sunsets in Udaipur',
  'Old Delhi culinary street food walk and spice bazaars',
  'Spiritual weekend trail in Varanasi and ghats',
  'Heritage architecture and art cafes in South Delhi',
];

export const HomeProvider: React.FC<HomeProviderProps> = ({
  children,
  searchService = defaultSearchService,
  aiService = defaultAIService,
}) => {
  const [activeMode, setActiveMode] = useState<HomeInteractionMode>('search');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [categorizedResults, setCategorizedResults] = useState<SearchCategorizedData | null>(null);
  const [activeMapCategory, setActiveMapCategoryState] = useState<string>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>(DEFAULT_SEARCH_HISTORY);
  const [promptHistory, setPromptHistory] = useState<string[]>(DEFAULT_PROMPT_HISTORY);
  const [hiddenGems, setHiddenGems] = useState<HiddenGemItem[]>([]);
  const [tips, setTips] = useState<TravelTipItem[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPoiItem[]>([]);
  const [aiResponse, setAiResponse] = useState<AIPromptResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isMapVisible, setIsMapVisible] = useState<boolean>(true);

  const currentSearchRequestId = useRef(0);
  const currentAIRequestId = useRef(0);

  const toggleMapVisible = () => setIsMapVisible((prev) => !prev);
  const toggleExpanded = () => setIsExpanded((prev) => !prev);
  const clearSearchQuery = () => setSearchQuery('');
  const clearAiPrompt = () => setAiPrompt('');

  const setActiveMapCategory = (category: string) => {
    setActiveMapCategoryState(category);
    // Auto-select the first place of this category if present
    if (categorizedResults) {
      let list: PlaceSearchResult[] = [];
      if (category === 'food') list = categorizedResults.food;
      else if (category === 'markets') list = categorizedResults.markets;
      else if (category === 'attractions') list = categorizedResults.attractions;
      else if (category === 'hidden_gems') list = categorizedResults.hidden_gems;
      else list = categorizedResults.places;

      if (list.length > 0) {
        setSelectedPlaceId(list[0].id);
      }
    }
  };

  const addAttachment = (item: AttachmentItem) => {
    setAttachments((prev) => [...prev, item]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const clearResults = () => {
    // Invalidate and cancel any in-flight async search or AI requests
    currentSearchRequestId.current += 1;
    currentAIRequestId.current += 1;
    setIsSearching(false);
    setIsProcessingAI(false);
    setSearchResults([]);
    setCategorizedResults(null);
    setActiveMapCategoryState('all');
    setAiResponse(null);
    setHiddenGems([]);
    setTips([]);
    setNearbyPlaces([]);
    setStatusMessage(null);
    setSelectedPlaceId(null);
  };

  // Ask for user geolocation on mount
  useEffect(() => {
    requestUserLocation();
  }, []);

  const requestUserLocation = async () => {
    try {
      logger.app('Requesting user geolocation permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('HomeContext', 'Location permission denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      logger.app(`User location retrieved: lat ${loc.coords.latitude}, lng ${loc.coords.longitude}`);
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (err: any) {
      logger.warn('HomeContext', 'Error fetching user location', err?.message);
    }
  };

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      logger.app('Loading suggestions via GET /suggestions...');
      const list = await searchService.getSuggestions(10);
      setSuggestions(list);
    } catch (err: any) {
      logger.warn('HomeContext', 'Error loading suggestions', err?.message);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const performSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!q) return;

    // Save to last 5 search history items (deduped)
    setSearchHistory((prev) => [q, ...prev.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 5));

    const reqId = ++currentSearchRequestId.current;
    setIsSearching(true);
    setStatusMessage(`Searching "${q}" across map layers...`);
    try {
      const categorized = await searchService.searchPlacesCategorized(q);
      if (reqId !== currentSearchRequestId.current) return; // Request was aborted/cancelled

      setCategorizedResults(categorized);
      setSearchResults(categorized.places);
      setActiveMapCategoryState('all');

      if (categorized.tips && categorized.tips.length > 0) {
        setTips(categorized.tips);
      }
      if (categorized.hidden_gems && categorized.hidden_gems.length > 0) {
        setHiddenGems(categorized.hidden_gems.map((h) => ({ name: h.name, description: h.reason || h.description })));
      }

      setStatusMessage(categorized.places.length > 0 ? `Found ${categorized.places.length} places for "${q}"` : 'No places found');

      // Auto-close sheet when search is hit and complete
      setIsExpanded(false);
      setIsMapVisible(true);

      // Auto-select first place on carousel and map
      if (categorized.places.length > 0) {
        setSelectedPlaceId(categorized.places[0].id);
      }
    } catch (err: any) {
      if (reqId === currentSearchRequestId.current) {
        setStatusMessage('Search error: Could not fetch places');
      }
    } finally {
      if (reqId === currentSearchRequestId.current) {
        setIsSearching(false);
      }
    }
  };

  const submitAIPrompt = async (promptToSubmit?: string) => {
    const p = (promptToSubmit !== undefined ? promptToSubmit : aiPrompt).trim();
    if (!p) return;

    // Save to last 5 prompt history items (deduped)
    setPromptHistory((prev) => [p, ...prev.filter((item) => item !== p)].slice(0, 5));

    const reqId = ++currentAIRequestId.current;
    setIsProcessingAI(true);
    setStatusMessage('Ghumo AI is crafting your travel itinerary...');
    try {
      const response = await aiService.generateItinerary({
        prompt: p,
        attachments,
      });
      if (reqId !== currentAIRequestId.current) return; // Request was aborted/cancelled
      setAiResponse(response);
      setStatusMessage(`Itinerary ready: ${response.title}`);
      setAiPrompt('');
      setAttachments([]);

      // Auto-close sheet when prompt is completed
      setIsExpanded(false);
      setIsMapVisible(true);

      // Auto-select first entry on carousel and map
      if (response.recommended_places && response.recommended_places.length > 0) {
        setSelectedPlaceId(`ai_p_0`);
      }
    } catch (err: any) {
      if (reqId === currentAIRequestId.current) {
        setStatusMessage('AI Generation error: Please try again');
      }
    } finally {
      if (reqId === currentAIRequestId.current) {
        setIsProcessingAI(false);
      }
    }
  };

  const submitPlaceRating = async (targetId: string, rating: number, targetType: 'place' | 'itinerary' = 'place') => {
    try {
      logger.app(`Submitting ${rating}-star rating for ${targetType}: ${targetId}`);
      const res = await searchService.submitTargetFeedback({
        user_id_or_anon: 'anon_traveler',
        target_type: targetType,
        target_id: targetId,
        rating,
      });

      // Update local state rating gracefully
      setSearchResults((prev) =>
        prev.map((item) =>
          item.id === targetId || item.name === targetId
            ? {
                ...item,
                rating: res.average_rating || rating,
                feedback: {
                  averageRating: res.average_rating || rating,
                  ratingCount: res.rating_count || 1,
                  weightedScore: res.weighted_score || rating,
                },
              }
            : item
        )
      );

      setSuggestions((prev) =>
        prev.map((item) =>
          item.id === targetId || item.name === targetId
            ? {
                ...item,
                rating: res.average_rating || rating,
                feedback: {
                  averageRating: res.average_rating || rating,
                  ratingCount: res.rating_count || 1,
                  weightedScore: res.weighted_score || rating,
                },
              }
            : item
        )
      );
    } catch (err: any) {
      logger.warn('HomeContext', 'Error submitting rating feedback', err?.message);
    }
  };

  const value = useMemo(
    () => ({
      activeMode,
      isExpanded,
      searchQuery,
      aiPrompt,
      attachments,
      isSearching,
      isLoadingSuggestions,
      isProcessingAI,
      suggestions,
      searchResults,
      hiddenGems,
      tips,
      nearbyPlaces,
      aiResponse,
      statusMessage,
      userLocation,
      selectedPlaceId,
      isMapVisible,
      setIsMapVisible,
      toggleMapVisible,
      setActiveMode,
      setIsExpanded,
      toggleExpanded,
      setSearchQuery,
      setAiPrompt,
      clearSearchQuery,
      clearAiPrompt,
      categorizedResults,
      activeMapCategory,
      searchHistory,
      promptHistory,
      setActiveMapCategory,
      addAttachment,
      removeAttachment,
      loadSuggestions,
      performSearch,
      submitAIPrompt,
      submitPlaceRating,
      clearResults,
      requestUserLocation,
      setSelectedPlaceId,
    }),
    [
      activeMode,
      isExpanded,
      searchQuery,
      aiPrompt,
      attachments,
      isSearching,
      isLoadingSuggestions,
      isProcessingAI,
      suggestions,
      searchResults,
      categorizedResults,
      activeMapCategory,
      searchHistory,
      promptHistory,
      hiddenGems,
      tips,
      nearbyPlaces,
      aiResponse,
      statusMessage,
      userLocation,
      selectedPlaceId,
      isMapVisible,
    ]
  );

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
};

export const useHome = (): HomeContextType => {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return context;
};
