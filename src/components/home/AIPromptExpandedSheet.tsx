import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/context/themeContext';
import { useHome } from '@/context/homeContext';

const STARTER_PROMPTS = [
  { id: '1', title: '🏰 3-Day Royal Heritage in Jaipur', prompt: 'Create a 3-day royal heritage itinerary for Jaipur covering forts, traditional dining, and local bazaars.' },
  { id: '2', title: '🌊 Lakeside Cafes & Sunsets in Udaipur', prompt: 'Find the most scenic lakeside cafes, sunset viewpoints, and boat ride spots in Udaipur.' },
  { id: '3', title: '🎒 Budget Backpacking in Himachal', prompt: 'Plan a budget-friendly 5-day mountain backpacking trip in Himachal Pradesh with hostel recommendations.' },
  { id: '4', title: '📸 Heritage Photography in Varanasi', prompt: 'Recommend early morning ghats and ancient architectural spots in Varanasi for street photography.' },
];

export const AIPromptExpandedSheet: React.FC = () => {
  const { theme, isDark } = useTheme();
  const {
    aiPrompt,
    setAiPrompt,
    submitAIPrompt,
    aiResponse,
    isProcessingAI,
    setIsExpanded,
    attachments,
    removeAttachment,
  } = useHome();

  // PanResponder to detect swipe down gesture to minimize
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 40) {
        setIsExpanded(false);
      }
    },
  });

  return (
    <View
      style={[
        styles.sheetContainer,
        {
          backgroundColor: isDark ? '#1E1C1A' : theme.colors.background.surface,
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      {/* Draggable Handle Bar (Swipe down to minimize) */}
      <View {...panResponder.panHandlers} style={styles.handleArea}>
        <View style={[styles.handleBar, { backgroundColor: isDark ? '#4A443F' : '#DED8D1' }]} />
      </View>

      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          ✨ Ghumo AI Travel Planner
        </Text>
        <TouchableOpacity
          onPress={() => setIsExpanded(false)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.minimizeText, { color: theme.colors.text.muted }]}>Close ✕</Text>
        </TouchableOpacity>
      </View>

      {/* Active Attachments list if present */}
      {attachments.length > 0 && (
        <View style={styles.attachmentList}>
          {attachments.map((att) => (
            <View
              key={att.id}
              style={[styles.attachmentBadge, { backgroundColor: isDark ? '#2E2B27' : '#F4EEE4' }]}
            >
              <Text style={[styles.attachmentText, { color: theme.colors.primary.default }]}>
                📎 {att.name}
              </Text>
              <TouchableOpacity onPress={() => removeAttachment(att.id)}>
                <Text style={styles.removeAttText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Generated Response or Starter Prompts */}
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {aiResponse ? (
          <View style={[styles.itineraryCard, { backgroundColor: isDark ? '#282421' : '#F8F3EA', borderColor: theme.colors.primary.default }]}>
            <Text style={[styles.itineraryTitle, { color: theme.colors.primary.default }]}>
              {aiResponse.title}
            </Text>
            <Text style={[styles.itinerarySummary, { color: theme.colors.text.primary }]}>
              {aiResponse.summary}
            </Text>

            {aiResponse.days?.map((day) => (
              <View key={day.dayNumber} style={styles.daySection}>
                <Text style={[styles.dayTitle, { color: theme.colors.text.primary }]}>
                  Day {day.dayNumber}: {day.title}
                </Text>
                {(day.places || day.activities || []).map((p: any, idx: number) => (
                  <Text key={idx} style={[styles.placeBullet, { color: theme.colors.text.secondary }]}>
                    • <Text style={{ fontWeight: '600', color: theme.colors.text.primary }}>{p.time || p.time_slot}</Text> - {p.name || p.place}: {p.description || p.purpose}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
              Starter Trip Inspirations
            </Text>
            {STARTER_PROMPTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.promptCard,
                  {
                    backgroundColor: isDark ? '#282522' : '#F5EFE6',
                    borderColor: isDark ? '#3E3833' : '#E8DFD3',
                  },
                ]}
                onPress={() => {
                  setAiPrompt(item.prompt);
                  submitAIPrompt(item.prompt);
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.promptTitle, { color: theme.colors.text.primary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.promptBody, { color: theme.colors.text.muted }]}>
                  {item.prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    width: '100%',
    maxHeight: 380,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  handleArea: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  handleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  minimizeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeAttText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8C9094',
  },
  contentScroll: {
    maxHeight: 250,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  promptCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  promptBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  itineraryCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  itineraryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itinerarySummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  daySection: {
    marginTop: 6,
    gap: 3,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  placeBullet: {
    fontSize: 12,
    lineHeight: 16,
  },
});
