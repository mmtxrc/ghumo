/**
 * Map Place Carousel Component
 * Gravity downwards: Floats directly above the Dynamic Bottom Bar on the Map View.
 * Displays centered peek-paginated place cards for active search or AI prompt results.
 * Features:
 * - Centered carousel cards with slight peek affordance for previous and next items
 * - Top-right day/itinerary budget indicator
 * - Synchronized circular time slot badges for AI itinerary days
 * - Days managed directly via the bottom bar category pills
 * - Bi-directional synchronization with OpenStreetMap camera & pins
 */

import React, { useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useTheme } from '@/context/themeContext';
import { useHome } from '@/context/homeContext';
import { PlaceSearchResult, TravelTipItem } from '@/domain/models/search';

interface DayTimeItem {
  id: string;
  dayIndex: number;
  dayLabel: string;
  time: string;
  timeNumber: string;
  timePeriod: string;
  place: PlaceSearchResult;
}

export const MapPlaceCarousel: React.FC = () => {
  const { theme, isDark } = useTheme();
  const {
    searchResults,
    categorizedResults,
    activeMapCategory,
    setActiveMapCategory,
    aiResponse,
    statusMessage,
    isSearching,
    isProcessingAI,
    isMapVisible,
    isExpanded,
    selectedPlaceId,
    setSelectedPlaceId,
    submitPlaceRating,
    clearResults,
  } = useHome();

  const placesScrollViewRef = useRef<ScrollView>(null);
  const timeScrollViewRef = useRef<ScrollView>(null);

  const screenWidth = Dimensions.get('window').width;
  const containerWidth = Math.min(screenWidth - 28, 440);
  const CARD_WIDTH = Math.round(containerWidth * 0.76);
  const CARD_GAP = 10;
  const SIDE_INSET = Math.max(12, Math.round((containerWidth - CARD_WIDTH) / 2));

  // Derive selectedDayIndex from activeMapCategory (synced with bottom pills)
  const selectedDayIndex = useMemo(() => {
    if (activeMapCategory && activeMapCategory.startsWith('day_')) {
      const parsed = parseInt(activeMapCategory.replace('day_', ''), 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return 0;
  }, [activeMapCategory]);

  // Helper to parse time strings like "09:00 AM", "1:30 PM", "09:30" into number and period
  const parseTime = (timeStr?: string, defaultIdx: number = 0): { num: string; period: string } => {
    if (!timeStr) {
      return { num: `${defaultIdx + 1}`, period: 'STOP' };
    }

    const trimmed = timeStr.trim();
    const match = trimmed.match(/^(\d{1,2}:\d{2})\s*(AM|PM)?/i);
    if (match) {
      return { num: match[1], period: (match[2] || '').toUpperCase() };
    }

    if (trimmed.toLowerCase().includes('morning')) return { num: '9:00', period: 'AM' };
    if (trimmed.toLowerCase().includes('afternoon') || trimmed.toLowerCase().includes('lunch')) return { num: '1:00', period: 'PM' };
    if (trimmed.toLowerCase().includes('evening') || trimmed.toLowerCase().includes('sunset')) return { num: '5:30', period: 'PM' };
    if (trimmed.toLowerCase().includes('night') || trimmed.toLowerCase().includes('dinner')) return { num: '8:00', period: 'PM' };

    const firstWord = trimmed.split(' ')[0];
    return { num: firstWord.length > 5 ? firstWord.slice(0, 5) : firstWord, period: '' };
  };

  // Build AI Day/Time structures
  const aiItineraryDays = useMemo(() => {
    if (!aiResponse) return [];

    if (aiResponse.days && aiResponse.days.length > 0) {
      return aiResponse.days.map((day, dIdx) => {
        const activities = day.activities || day.places || [];
        const items: DayTimeItem[] = activities.map((act, actIdx) => {
          const rawTime = act.time || act.time_slot || `Stop ${actIdx + 1}`;
          const parsed = parseTime(rawTime, actIdx);
          const place: PlaceSearchResult = {
            id: `ai_d${dIdx}_p${actIdx}`,
            name: act.name || act.place || 'Curated Landmark',
            category: `Day ${day.dayNumber || day.day || dIdx + 1}`,
            type: 'attraction',
            description: act.description || act.purpose || 'Must-visit highlight of this itinerary.',
            reason: act.description || act.purpose,
            rating: 4.8,
            lat: act.lat,
            lng: act.lng,
            image: act.image || null,
          };

          return {
            id: place.id,
            dayIndex: dIdx,
            dayLabel: day.title || `Day ${day.dayNumber || day.day || dIdx + 1}`,
            time: rawTime,
            timeNumber: parsed.num,
            timePeriod: parsed.period,
            place,
          };
        });

        return {
          dayIndex: dIdx,
          dayNumber: day.dayNumber || day.day || dIdx + 1,
          dayTitle: day.title || `Day ${day.dayNumber || day.day || dIdx + 1}`,
          estimatedDayCost: day.estimated_day_cost,
          items,
        };
      });
    }

    if (aiResponse.recommended_places && aiResponse.recommended_places.length > 0) {
      const defaultTimes = ['09:30 AM', '12:00 PM', '02:30 PM', '05:00 PM', '07:30 PM'];
      const items: DayTimeItem[] = aiResponse.recommended_places.map((p, idx) => {
        const rawTime = defaultTimes[idx % defaultTimes.length];
        const parsed = parseTime(rawTime, idx);
        const place: PlaceSearchResult = {
          id: `ai_d0_p${idx}`,
          name: p.name,
          category: p.type === 'food' ? 'Food Stop' : (p.type || 'Highlight'),
          type: p.type || 'attraction',
          description: p.reason || 'Curated recommendation for this destination.',
          reason: p.reason,
          rating: 4.8,
          lat: p.lat,
          lng: p.lng,
          image: p.image || null,
        };

        return {
          id: place.id,
          dayIndex: 0,
          dayLabel: 'Day 1: Highlights',
          time: rawTime,
          timeNumber: parsed.num,
          timePeriod: parsed.period,
          place,
        };
      });

      return [
        {
          dayIndex: 0,
          dayNumber: 1,
          dayTitle: 'Day 1: Curated Highlights',
          estimatedDayCost: undefined,
          items,
        },
      ];
    }

    return [];
  }, [aiResponse]);

  // Sync active day schedule
  const activeDaySchedule = aiItineraryDays[selectedDayIndex] || aiItineraryDays[0];
  const activeDayPlaces = activeDaySchedule?.items || [];

  // When day changes, scroll to initial position & focus first place
  useEffect(() => {
    if (activeDayPlaces.length > 0) {
      const currentSelected = activeDayPlaces.find((p) => p.id === selectedPlaceId);
      if (!currentSelected) {
        setSelectedPlaceId(activeDayPlaces[0].id);
        placesScrollViewRef.current?.scrollTo({ x: 0, animated: true });
        timeScrollViewRef.current?.scrollTo({ x: 0, animated: true });
      } else {
        const idx = activeDayPlaces.indexOf(currentSelected);
        if (idx >= 0) {
          placesScrollViewRef.current?.scrollTo({ x: idx * (CARD_WIDTH + CARD_GAP), animated: true });
        }
      }
    }
  }, [selectedDayIndex]);

  // Filter places for search mode
  const filteredSearchPlaces: PlaceSearchResult[] = useMemo(() => {
    if (categorizedResults) {
      if (activeMapCategory === 'food') return categorizedResults.food;
      if (activeMapCategory === 'markets') return categorizedResults.markets;
      if (activeMapCategory === 'attractions') return categorizedResults.attractions;
      if (activeMapCategory === 'hidden_gems') return categorizedResults.hidden_gems;
      return categorizedResults.places;
    }

    if (searchResults.length > 0) {
      if (activeMapCategory === 'food') return searchResults.filter((p) => p.type === 'food' || p.category?.toLowerCase().includes('food'));
      if (activeMapCategory === 'markets') return searchResults.filter((p) => p.type === 'market' || p.category?.toLowerCase().includes('market'));
      if (activeMapCategory === 'attractions') return searchResults.filter((p) => p.type === 'attraction' || (!p.type?.includes('food') && !p.type?.includes('market')));
      return searchResults;
    }

    return [];
  }, [categorizedResults, searchResults, activeMapCategory]);

  const activeTips: TravelTipItem[] = useMemo(() => {
    if (categorizedResults?.tips && categorizedResults.tips.length > 0) {
      return categorizedResults.tips;
    }
    if (aiResponse?.tips && aiResponse.tips.length > 0) {
      return aiResponse.tips.map((t) => ({ text: t, category: 'Travel Advice' }));
    }
    return [];
  }, [categorizedResults, aiResponse]);

  const isTipsMode = activeMapCategory === 'tips' && activeTips.length > 0;
  const hasAiContent = Boolean(aiResponse) && aiItineraryDays.length > 0;
  const hasSearchContent = filteredSearchPlaces.length > 0 || isTipsMode;
  const hasContent = hasAiContent || hasSearchContent;
  const isVisible = isMapVisible && !isExpanded && (hasContent || isSearching || isProcessingAI);

  if (!isVisible) {
    return null;
  }

  // Header Title & Location
  const headerTitle = aiResponse
    ? (aiResponse.title || `Trip to ${aiResponse.location || 'Destination'}`)
    : isTipsMode
    ? `Travel Tips (${activeTips.length})`
    : `${activeMapCategory === 'all' ? 'All Places' : activeMapCategory.toUpperCase()} (${filteredSearchPlaces.length})`;

  // Budget for top right header (day budget or total budget)
  const displayBudget = aiResponse
    ? (activeDaySchedule?.estimatedDayCost || aiResponse.budget_breakdown?.activities || aiResponse.budget)
    : null;

  // Handle Time circle tap
  const handleSelectTimeItem = (item: DayTimeItem, index: number) => {
    setSelectedPlaceId(item.id);
    placesScrollViewRef.current?.scrollTo({ x: index * (CARD_WIDTH + CARD_GAP), animated: true });
  };

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View
        style={[
          styles.carouselWrapper,
          {
            width: containerWidth,
            backgroundColor: isDark ? 'rgba(27,26,24,0.97)' : 'rgba(255,253,249,0.97)',
            borderColor: isDark ? '#38332E' : '#E5DDD1',
          },
        ]}
      >
        {/* Top Header Row with Title, Location, Budget badge & Close button */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <Text style={[styles.statusText, { color: theme.colors.text.primary }]} numberOfLines={1}>
              {headerTitle}
            </Text>
            {Boolean(aiResponse?.location) && (
              <Text style={[styles.subLocationText, { color: theme.colors.primary.default }]} numberOfLines={1}>
                📍 {aiResponse?.location}
              </Text>
            )}
          </View>

          {/* Right Header Group: Day Budget + Close '✕' Button */}
          <View style={styles.headerRightGroup}>
            {Boolean(displayBudget) && (
              <View
                style={[
                  styles.budgetBadge,
                  {
                    backgroundColor: isDark ? '#38281E' : '#FCEFE7',
                    borderColor: theme.colors.primary.default,
                  },
                ]}
              >
                <Text style={[styles.budgetText, { color: theme.colors.primary.default }]} numberOfLines={1}>
                  💰 {displayBudget}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={clearResults}
              style={[styles.closeButton, { backgroundColor: isDark ? '#3A3530' : '#E8E2D8' }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close itinerary cards"
            >
              <Text style={[styles.closeText, { color: theme.colors.text.secondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= AI PROMPT VIEW: TIME CIRCLES + CENTERED PLACE CARDS ================= */}
        {hasAiContent ? (
          <View style={styles.aiContentContainer}>
            {/* 1. Time Slot Circles ( 9:00 AM ) ( 11:30 AM ) ( 1:30 PM ) */}
            {activeDayPlaces.length > 0 && (
              <ScrollView
                ref={timeScrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.timeScrollContainer}
                style={styles.timeScrollView}
              >
                {activeDayPlaces.map((item, idx) => {
                  const isTimeSelected = selectedPlaceId === item.id || (!selectedPlaceId && idx === 0);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.85}
                      onPress={() => handleSelectTimeItem(item, idx)}
                      style={[
                        styles.timeCircle,
                        {
                          backgroundColor: isTimeSelected
                            ? theme.colors.primary.default
                            : (isDark ? '#262320' : '#F5EFE6'),
                          borderColor: isTimeSelected
                            ? '#FFFFFF'
                            : (isDark ? '#3D3732' : '#E2D9CC'),
                          shadowColor: isTimeSelected ? theme.colors.primary.default : 'transparent',
                          shadowOpacity: isTimeSelected ? 0.35 : 0,
                          shadowRadius: 6,
                          elevation: isTimeSelected ? 4 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeCircleNum,
                          {
                            color: isTimeSelected ? '#FFFFFF' : theme.colors.text.primary,
                            fontWeight: isTimeSelected ? '800' : '700',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.timeNumber}
                      </Text>
                      {Boolean(item.timePeriod) && (
                        <Text
                          style={[
                            styles.timeCirclePeriod,
                            {
                              color: isTimeSelected ? 'rgba(255,255,255,0.9)' : theme.colors.text.muted,
                              fontWeight: isTimeSelected ? '700' : '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.timePeriod}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* 2. Horizontal Centered Peek-Paginated Place Cards with Brief Descriptions */}
            <ScrollView
              ref={placesScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              snapToInterval={CARD_WIDTH + CARD_GAP}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={[
                styles.scrollContainer,
                { paddingHorizontal: SIDE_INSET, gap: CARD_GAP },
              ]}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
                if (activeDayPlaces[index]) {
                  setSelectedPlaceId(activeDayPlaces[index].id);
                }
              }}
            >
              {activeDayPlaces.map((item) => {
                const place = item.place;
                const isSelected = selectedPlaceId === place.id;
                const imageUri = place.image?.url || place.imageUrl;

                return (
                  <TouchableOpacity
                    key={place.id}
                    activeOpacity={0.92}
                    onPress={() => setSelectedPlaceId(place.id)}
                    style={[
                      styles.card,
                      {
                        width: CARD_WIDTH,
                        backgroundColor: isDark ? '#23211F' : '#FAF6EE',
                        borderColor: isSelected ? theme.colors.primary.default : (isDark ? '#38332E' : '#E8E0D2'),
                        borderWidth: isSelected ? 1.8 : 1,
                      },
                    ]}
                  >
                    <View style={styles.cardContentRow}>
                      {/* Thumbnail Image */}
                      {imageUri ? (
                        <RNImage source={{ uri: imageUri }} style={styles.placeImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.placeholderThumb, { backgroundColor: isDark ? '#332E2A' : '#EAE3D5' }]}>
                          <Text style={{ fontSize: 22 }}>
                            {place.type === 'food' ? '🍲' : place.type === 'market' ? '🛍' : '🏰'}
                          </Text>
                        </View>
                      )}

                      {/* Place Details & Output Description */}
                      <View style={styles.detailsCol}>
                        <View style={styles.titleRow}>
                          <Text style={[styles.placeName, { color: theme.colors.text.primary }]} numberOfLines={1}>
                            {place.name}
                          </Text>
                          {Boolean(place.rating) && (
                            <Text style={[styles.ratingText, { color: theme.colors.primary.default }]}>
                              ★ {place.rating}
                            </Text>
                          )}
                        </View>

                        {/* Scheduled Time & Category Tag */}
                        <Text style={[styles.timeScheduleBadge, { color: theme.colors.primary.default }]} numberOfLines={1}>
                          ⏰ {item.time}
                        </Text>

                        {/* Brief Description from Output */}
                        {Boolean(place.description || place.reason) && (
                          <Text style={[styles.descText, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                            {place.description || place.reason}
                          </Text>
                        )}

                        {/* 1-5 Star Interactive Rating */}
                        <View style={styles.ratingRow}>
                          <Text style={[styles.rateLabel, { color: theme.colors.text.muted }]}>Rate:</Text>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                              key={star}
                              style={[styles.starBtn, { backgroundColor: isDark ? '#2E2B27' : '#EFE8DE' }]}
                              onPress={() => submitPlaceRating(place.id, star)}
                              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            >
                              <Text style={{ fontSize: 10.5, color: '#D95338', fontWeight: '700' }}>{star}★</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : isTipsMode ? (
          /* ================= TIPS VIEW ================= */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={[
              styles.scrollContainer,
              { paddingHorizontal: SIDE_INSET, gap: CARD_GAP },
            ]}
          >
            {activeTips.map((tip: TravelTipItem, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.card,
                  {
                    width: CARD_WIDTH,
                    backgroundColor: isDark ? '#1E2522' : '#EFF7F4',
                    borderColor: theme.colors.brand.heritageGreen,
                    borderWidth: 1.2,
                  },
                ]}
              >
                <View style={styles.tipCardHeader}>
                  <Text style={[styles.tipCategoryBadge, { color: theme.colors.brand.heritageGreen }]}>
                    💡 {tip.category ? tip.category.toUpperCase() : 'LOCAL TIP'}
                  </Text>
                </View>
                <Text style={[styles.tipCardText, { color: theme.colors.text.primary }]}>
                  {tip.text || tip.tip_text || ''}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : filteredSearchPlaces.length > 0 ? (
          /* ================= SEARCH RESULTS CAROUSEL ================= */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={[
              styles.scrollContainer,
              { paddingHorizontal: SIDE_INSET, gap: CARD_GAP },
            ]}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
              if (filteredSearchPlaces[index]) {
                setSelectedPlaceId(filteredSearchPlaces[index].id);
              }
            }}
          >
            {filteredSearchPlaces.map((place) => {
              const isSelected = selectedPlaceId === place.id;
              const imageUri = place.image?.url || place.imageUrl;

              return (
                <TouchableOpacity
                  key={place.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedPlaceId(place.id)}
                  style={[
                    styles.card,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: isDark ? '#23211F' : '#FAF6EE',
                      borderColor: isSelected ? theme.colors.primary.default : (isDark ? '#38332E' : '#E8E0D2'),
                      borderWidth: isSelected ? 1.8 : 1,
                    },
                  ]}
                >
                  <View style={styles.cardContentRow}>
                    {/* Place Thumbnail */}
                    {imageUri ? (
                      <RNImage source={{ uri: imageUri }} style={styles.placeImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.placeholderThumb, { backgroundColor: isDark ? '#332E2A' : '#EAE3D5' }]}>
                        <Text style={{ fontSize: 22 }}>
                          {place.type === 'food' ? '🍲' : place.type === 'market' ? '🛍' : '📍'}
                        </Text>
                      </View>
                    )}

                    {/* Place Details */}
                    <View style={styles.detailsCol}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.placeName, { color: theme.colors.text.primary }]} numberOfLines={1}>
                          {place.name}
                        </Text>
                        {Boolean(place.rating || place.feedback?.averageRating) && (
                          <Text style={[styles.ratingText, { color: theme.colors.primary.default }]}>
                            ★ {place.rating || place.feedback?.averageRating}
                          </Text>
                        )}
                      </View>

                      {Boolean(place.reason || place.description) && (
                        <Text style={[styles.descText, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                          {place.reason || place.description}
                        </Text>
                      )}

                      {/* 1-5 Star Interactive Rating */}
                      <View style={styles.ratingRow}>
                        <Text style={[styles.rateLabel, { color: theme.colors.text.muted }]}>Rate:</Text>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            style={[styles.starBtn, { backgroundColor: isDark ? '#2E2B27' : '#EFE8DE' }]}
                            onPress={() => submitPlaceRating(place.id, star)}
                            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                          >
                            <Text style={{ fontSize: 10.5, color: '#D95338', fontWeight: '700' }}>{star}★</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 146, // Aligned directly above the floating pills row
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 90,
  },
  carouselWrapper: {
    borderRadius: 22,
    borderWidth: 1,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    paddingHorizontal: 12,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subLocationText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 130,
  },
  budgetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiContentContainer: {
    width: '100%',
    gap: 6,
  },
  timeScrollView: {
    width: '100%',
    marginVertical: 1,
  },
  timeScrollContainer: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    alignItems: 'center',
  },
  timeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  timeCircleNum: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
  timeCirclePeriod: {
    fontSize: 8,
    marginTop: 0.5,
    letterSpacing: 0.4,
  },
  scrollContainer: {
    paddingVertical: 2,
  },
  card: {
    borderRadius: 16,
    padding: 10,
  },
  cardContentRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  placeImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  placeholderThumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeName: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  timeScheduleBadge: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  descText: {
    fontSize: 11.5,
    lineHeight: 15,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginRight: 2,
  },
  starBtn: {
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  tipCardHeader: {
    marginBottom: 4,
  },
  tipCategoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tipCardText: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
  },
});
