/**
 * Map Place Carousel Component
 * Gravity downwards: Floats directly above the Dynamic Bottom Bar on the Map View.
 * Displays horizontal swipeable place cards for active search or AI prompt results.
 * Selecting or cycling through cards syncs with the OpenStreetMap pins.
 */

import React, { useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image as RNImage,
  Platform,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useTheme } from '@/context/themeContext';
import { useHome } from '@/context/homeContext';
import { PlaceSearchResult, TravelTipItem } from '@/domain/models/search';

export const MapPlaceCarousel: React.FC = () => {
  const { theme, isDark } = useTheme();
  const {
    searchResults,
    categorizedResults,
    activeMapCategory,
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

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.min(screenWidth - 48, 380);

  // Filter places based on active map category
  const filteredPlaces: PlaceSearchResult[] = useMemo(() => {
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

    if (aiResponse?.recommended_places) {
      return aiResponse.recommended_places.map((p, idx) => ({
        id: `ai_p_${idx}`,
        name: p.name,
        category: p.type === 'food' ? 'Food Stop' : 'Must-Visit Spot',
        type: p.type || 'attraction',
        description: p.reason,
        reason: p.reason,
        rating: 4.8,
      }));
    }

    return [];
  }, [categorizedResults, searchResults, aiResponse, activeMapCategory]);

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
  const hasContent = isTipsMode ? activeTips.length > 0 : filteredPlaces.length > 0;
  const isVisible = isMapVisible && !isExpanded && (hasContent || isSearching || isProcessingAI);

  if (!isVisible) {
    return null;
  }

  const categoryTitle = isTipsMode
    ? `Travel Tips (${activeTips.length})`
    : `${activeMapCategory === 'all' ? 'All Places' : activeMapCategory.toUpperCase()} (${filteredPlaces.length})`;

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View
        style={[
          styles.carouselWrapper,
          {
            backgroundColor: isDark ? 'rgba(27,26,24,0.96)' : 'rgba(255,253,249,0.96)',
            borderColor: isDark ? '#35312D' : '#E5DDD1',
          },
        ]}
      >
        {/* Top Header Row with Status Message & '✕' button */}
        <View style={styles.headerRow}>
          <Text style={[styles.statusText, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {statusMessage || (isSearching ? 'Scanning map layers...' : categoryTitle)}
          </Text>
          <TouchableOpacity
            onPress={clearResults}
            style={[styles.closeButton, { backgroundColor: isDark ? '#3A3530' : '#E8E2D8' }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close place cards"
          >
            <Text style={[styles.closeText, { color: theme.colors.text.secondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tips View or Places Carousel */}
        {isTipsMode ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.scrollContainer}
          >
            {activeTips.map((tip: TravelTipItem, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
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
        ) : filteredPlaces.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContainer}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / (cardWidth + 12));
              if (filteredPlaces[index]) {
                setSelectedPlaceId(filteredPlaces[index].id);
              }
            }}
          >
            {filteredPlaces.map((place) => {
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
                      width: cardWidth,
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
                        <Text style={{ fontSize: 24 }}>
                          {place.type === 'food' ? '🍲' : place.type === 'market' ? '🛍' : '📍'}
                        </Text>
                      </View>
                    )}

                    {/* Place Details */}
                    <View style={styles.detailsCol}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.placeName, { color: theme.colors.text.primary }]} numberOfLines={1}>
                          {place.type === 'food' ? '🍲' : place.type === 'market' ? '🛍' : '📍'} {place.name}
                        </Text>
                        {Boolean(place.rating || place.feedback?.averageRating) && (
                          <Text style={[styles.ratingText, { color: theme.colors.primary.default }]}>
                            ★ {place.rating || place.feedback?.averageRating}
                          </Text>
                        )}
                      </View>

                      {Boolean(place.vibe) && (
                        <Text style={[styles.vibeText, { color: theme.colors.primary.default }]} numberOfLines={1}>
                          ✨ {place.vibe}
                        </Text>
                      )}

                      {Boolean(place.reason || place.description) && (
                        <Text style={[styles.descText, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                          {place.reason || place.description}
                        </Text>
                      )}

                      {Boolean(place.must_try_cuisine || place.dietary) && (
                        <Text style={[styles.metaInfoText, { color: theme.colors.text.muted }]} numberOfLines={1}>
                          🍽️ {place.dietary ? `${place.dietary} • ` : ''}{place.must_try_cuisine}
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
                            <Text style={{ fontSize: 11, color: '#D95338', fontWeight: '700' }}>{star}★</Text>
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
    bottom: 148, // Placed with generous 10+ points margin above the map toggle & pills row
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 90,
  },
  carouselWrapper: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContainer: {
    gap: 12,
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
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  ratingText: {
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 6,
  },
  categoryText: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  vibeText: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  descText: {
    fontSize: 11.5,
    lineHeight: 15,
    marginTop: 2,
  },
  metaInfoText: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  rateLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginRight: 2,
  },
  starBtn: {
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  tipCardHeader: {
    marginBottom: 6,
  },
  tipCategoryBadge: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tipCardText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
