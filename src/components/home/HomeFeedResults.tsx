import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/themeContext';
import { useHome } from '@/context/homeContext';

export const HomeFeedResults: React.FC = () => {
  const { theme, isDark } = useTheme();
  const {
    searchResults,
    aiResponse,
    statusMessage,
    isSearching,
    isProcessingAI,
    clearResults,
  } = useHome();

  const hasResults = searchResults.length > 0 || Boolean(aiResponse) || Boolean(statusMessage);

  if (!hasResults && !isSearching && !isProcessingAI) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(27,26,24,0.95)' : 'rgba(255,253,249,0.95)',
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.statusText, { color: theme.colors.text.primary }]}>
          {statusMessage || (isSearching ? 'Searching...' : 'Processing...')}
        </Text>
        <TouchableOpacity onPress={clearResults} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.closeText, { color: theme.colors.text.muted }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Place Search Results */}
      {searchResults.length > 0 && (
        <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
          {searchResults.map((place) => (
            <View
              key={place.id}
              style={[
                styles.placeItem,
                { borderBottomColor: theme.colors.border.default },
              ]}
            >
              <View style={styles.placeHeader}>
                <Text style={[styles.placeName, { color: theme.colors.text.primary }]}>
                  📍 {place.name}
                </Text>
                {place.rating && (
                  <Text style={[styles.placeRating, { color: theme.colors.primary.default }]}>
                    ★ {place.rating}
                  </Text>
                )}
              </View>
              {place.category && (
                <Text style={[styles.placeCategory, { color: theme.colors.text.secondary }]}>
                  {place.category}
                </Text>
              )}
              {place.description && (
                <Text style={[styles.placeDesc, { color: theme.colors.text.muted }]}>
                  {place.description}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* AI Generated Itinerary Preview */}
      {aiResponse && (
        <View style={styles.itineraryPreview}>
          <Text style={[styles.itineraryTitle, { color: theme.colors.primary.default }]}>
            ✨ {aiResponse.title}
          </Text>
          <Text style={[styles.itinerarySummary, { color: theme.colors.text.secondary }]}>
            {aiResponse.summary}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    maxWidth: 440,
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    maxHeight: 280,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  statusText: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  resultsList: {
    marginTop: 6,
  },
  placeItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  placeRating: {
    fontSize: 12,
    fontWeight: '700',
  },
  placeCategory: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  placeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  itineraryPreview: {
    marginTop: 8,
    gap: 4,
  },
  itineraryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itinerarySummary: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
