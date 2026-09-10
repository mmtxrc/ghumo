/**
 * Home State Management & Context
 * Orchestrates Search, AI Prompt interactions, and Sheet Expansion states.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { PlaceSearchResult, ISearchService } from '@/domain/models/search';
import { AttachmentItem, AIPromptResponse, IAIService } from '@/domain/models/ai';
import { defaultSearchService } from '@/data/services/searchService';
import { defaultAIService } from '@/data/services/aiService';

export type HomeInteractionMode = 'search' | 'ai';

interface HomeContextType {
  activeMode: HomeInteractionMode;
  isExpanded: boolean;
  searchQuery: string;
  aiPrompt: string;
  attachments: AttachmentItem[];
  isSearching: boolean;
  isProcessingAI: boolean;
  searchResults: PlaceSearchResult[];
  aiResponse: AIPromptResponse | null;
  statusMessage: string | null;
  setActiveMode: (mode: HomeInteractionMode) => void;
  setIsExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  setSearchQuery: (q: string) => void;
  setAiPrompt: (p: string) => void;
  clearSearchQuery: () => void;
  clearAiPrompt: () => void;
  addAttachment: (item: AttachmentItem) => void;
  removeAttachment: (id: string) => void;
  performSearch: (query?: string) => Promise<void>;
  submitAIPrompt: (prompt?: string) => Promise<void>;
  clearResults: () => void;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

interface HomeProviderProps {
  children: React.ReactNode;
  searchService?: ISearchService;
  aiService?: IAIService;
}

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
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [aiResponse, setAiResponse] = useState<AIPromptResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const toggleExpanded = () => setIsExpanded((prev) => !prev);
  const clearSearchQuery = () => setSearchQuery('');
  const clearAiPrompt = () => setAiPrompt('');

  const addAttachment = (item: AttachmentItem) => {
    setAttachments((prev) => [...prev, item]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const clearResults = () => {
    setSearchResults([]);
    setAiResponse(null);
    setStatusMessage(null);
  };

  const performSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setStatusMessage(`Searching "${q}"...`);
    try {
      const results = await searchService.searchPlaces(q);
      setSearchResults(results);
      setStatusMessage(results.length > 0 ? `Found ${results.length} places for "${q}"` : 'No places found');
    } catch (err: any) {
      setStatusMessage('Search error: Could not fetch places');
    } finally {
      setIsSearching(false);
    }
  };

  const submitAIPrompt = async (promptToSubmit?: string) => {
    const p = (promptToSubmit !== undefined ? promptToSubmit : aiPrompt).trim();
    if (!p) return;

    setIsProcessingAI(true);
    setStatusMessage('Ghumo AI is crafting your travel itinerary...');
    try {
      const response = await aiService.generateItinerary({
        prompt: p,
        attachments,
      });
      setAiResponse(response);
      setStatusMessage(`Itinerary ready: ${response.title}`);
      setAiPrompt('');
      setAttachments([]);
    } catch (err: any) {
      setStatusMessage('AI Generation error: Please try again');
    } finally {
      setIsProcessingAI(false);
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
      isProcessingAI,
      searchResults,
      aiResponse,
      statusMessage,
      setActiveMode,
      setIsExpanded,
      toggleExpanded,
      setSearchQuery,
      setAiPrompt,
      clearSearchQuery,
      clearAiPrompt,
      addAttachment,
      removeAttachment,
      performSearch,
      submitAIPrompt,
      clearResults,
    }),
    [
      activeMode,
      isExpanded,
      searchQuery,
      aiPrompt,
      attachments,
      isSearching,
      isProcessingAI,
      searchResults,
      aiResponse,
      statusMessage,
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
