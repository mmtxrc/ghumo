/**
 * Prompt View Content Component
 * - Displays header with close button, dynamic AI prompt input, attachment picker,
 *   starter trip inspirations, and generated day-by-day travel itineraries.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { ScrollView, GestureDetector, type PanGesture } from 'react-native-gesture-handler';
import Svg, { Path, Line } from 'react-native-svg';
import { useTheme } from '@/context/themeContext';
import { useHome } from '@/context/homeContext';
import { AttachmentPickerModal } from './AttachmentPickerModal';
import { ProcessingOutline } from './ProcessingOutline';
import { SAMPLE_ITINERARIES } from '@/data/sampleDatasets';

const STARTER_PROMPTS = [
  { id: '1', title: `🗺️ ${SAMPLE_ITINERARIES[0].title}`, prompt: SAMPLE_ITINERARIES[0].summary },
  { id: '2', title: `🍛 ${SAMPLE_ITINERARIES[1].title}`, prompt: SAMPLE_ITINERARIES[1].summary },
  { id: '3', title: '🏰 3-Day Royal Heritage in Jaipur', prompt: 'Create a 3-day royal heritage itinerary for Jaipur covering forts, traditional dining, and local bazaars.' },
  { id: '4', title: '🌊 Lakeside Cafes & Sunsets in Udaipur', prompt: 'Find the most scenic lakeside cafes, sunset viewpoints, and boat ride spots in Udaipur.' },
];

interface PromptViewProps {
  onClose: () => void;
  headerGesture?: PanGesture;
}

export const PromptView: React.FC<PromptViewProps> = ({ onClose, headerGesture }) => {
  const { theme, isDark } = useTheme();
  const {
    aiPrompt,
    setAiPrompt,
    submitAIPrompt,
    aiResponse,
    isProcessingAI,
    promptHistory,
    attachments,
    removeAttachment,
    clearAiPrompt,
  } = useHome();

  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedHistoryPrompt, setSelectedHistoryPrompt] = useState<string | null>(null);
  const promptInputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    if (aiPrompt.trim()) {
      submitAIPrompt(aiPrompt);
    }
  };

  // Header Zone 1 (Title, Close button, Input box, Attachments)
  const headerContent = (
    <View style={styles.zone1HeaderArea}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Ghumo AI Travel Planner
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: isDark ? '#2B2724' : '#EFE9DE' }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Close prompt view"
        >
          <Text style={[styles.closeText, { color: theme.colors.text.secondary }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Embedded Dynamic Prompt Input Field with Rotating Accent Outline */}
      <View style={styles.promptInputContainer}>
        <ProcessingOutline isProcessing={isProcessingAI} borderRadius={25} strokeWidth={2.0}>
          <View
            style={[
              styles.promptInputWrapper,
              {
                backgroundColor: isDark ? '#25221F' : '#F6F1E9',
                borderColor: isProcessingAI ? 'transparent' : theme.colors.primary.default,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.plusButton, { backgroundColor: isDark ? '#2E2B27' : '#EBE4D8' }]}
              activeOpacity={0.7}
              onPress={() => setAttachmentModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Add attachment or media"
            >
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary.default} strokeWidth="2.5" strokeLinecap="round">
                <Line x1="12" y1="5" x2="12" y2="19" />
                <Line x1="5" y1="12" x2="19" y2="12" />
              </Svg>
            </TouchableOpacity>

            <TextInput
              ref={promptInputRef}
              style={[styles.textInput, { color: theme.colors.text.primary }]}
              placeholder="Ask Ghumo AI to plan a trip, itinerary, or cafe list..."
              placeholderTextColor={theme.colors.text.muted}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
              scrollEnabled={false}
              autoCapitalize="sentences"
              selectionColor={theme.colors.primary.default}
            />

            {aiPrompt.trim().length > 0 && (
              <TouchableOpacity
                onPress={clearAiPrompt}
                style={styles.clearBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[styles.clearBadge, { backgroundColor: isDark ? '#3A3530' : '#E2DCD2' }]}>
                  <Text style={[styles.clearBadgeText, { color: theme.colors.text.secondary }]}>✕</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: aiPrompt.trim().length > 0 ? theme.colors.primary.default : (isDark ? '#35312D' : '#DED8CE'),
                },
              ]}
              onPress={handleSubmit}
              disabled={!aiPrompt.trim() || isProcessingAI}
              activeOpacity={0.8}
            >
              {isProcessingAI ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12h14" />
                  <Path d="m12 5 7 7-7 7" />
                </Svg>
              )}
            </TouchableOpacity>
          </View>
        </ProcessingOutline>
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
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Zone 1: Header / Non-scrollable sheet drag area */}
      {headerGesture ? (
        <GestureDetector gesture={headerGesture}>
          {headerContent}
        </GestureDetector>
      ) : (
        headerContent
      )}

      {/* Zone 3: Main Scrollable Content: Generated Itinerary or Starter Inspirations */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[styles.contentInner, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="always"
      >
        {isProcessingAI && (
          <View style={[styles.loadingCard, { backgroundColor: isDark ? '#24211E' : '#F7F2E9', borderColor: theme.colors.primary.default }]}>
            <ActivityIndicator size="small" color={theme.colors.primary.default} />
            <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
              Ghumo AI is curating your personalized travel itinerary...
            </Text>
          </View>
        )}

        {/* Recent AI Prompts (Last 5 history items in one line - Press & Hold to preview full, Tap to execute) */}
        {!aiResponse && promptHistory && promptHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionHeading, { color: theme.colors.text.secondary }]}>
              🕐 Recent Prompts
            </Text>
            <View style={styles.historyList}>
              {promptHistory.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.historyItem,
                    {
                      backgroundColor: isDark ? '#24211E' : '#FAF6EE',
                      borderColor: isDark ? '#36312C' : '#E8E1D5',
                    },
                  ]}
                  onPress={() => {
                    setAiPrompt(item);
                    submitAIPrompt(item);
                  }}
                  onLongPress={() => {
                    setSelectedHistoryPrompt(item);
                  }}
                  delayLongPress={350}
                  activeOpacity={0.75}
                >
                  <Text style={styles.historyIcon}>✨</Text>
                  <Text
                    style={[styles.historyText, { color: theme.colors.text.primary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item}
                  </Text>
                  <Text style={[styles.historyActionText, { color: theme.colors.primary.default }]}>
                    Go →
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {aiResponse ? (
          <View style={[styles.itineraryCard, { backgroundColor: isDark ? '#24211E' : '#F9F4EB', borderColor: theme.colors.primary.default }]}>
            <View style={styles.itineraryHeader}>
              <Text style={[styles.itineraryTitle, { color: theme.colors.primary.default }]}>
                ✨ {aiResponse.title}
              </Text>
              {aiResponse.budget && (
                <Text style={[styles.budgetBadge, { color: theme.colors.primary.default, backgroundColor: isDark ? '#2B2520' : '#F7EBE2' }]}>
                  💰 {aiResponse.budget}
                </Text>
              )}
            </View>
            <Text style={[styles.itinerarySummary, { color: theme.colors.text.primary }]}>
              {aiResponse.summary}
            </Text>

            {/* Recommended Places Section (e.g., from /itinerary/video) */}
            {aiResponse.recommended_places && aiResponse.recommended_places.length > 0 && (
              <View style={styles.recommendedSection}>
                <Text style={[styles.sectionHeading, { color: theme.colors.text.secondary }]}>
                  📍 Recommended Spots & Food Stops
                </Text>
                {aiResponse.recommended_places.map((place, pIdx) => (
                  <View
                    key={pIdx}
                    style={[
                      styles.recPlaceCard,
                      {
                        backgroundColor: isDark ? '#1F1D1A' : '#FFFFFF',
                        borderColor: theme.colors.border.default,
                      },
                    ]}
                  >
                    <View style={styles.recPlaceHeader}>
                      <Text style={[styles.recPlaceName, { color: theme.colors.text.primary }]}>
                        {place.type === 'food' ? '🍲' : '📍'} {place.name}
                      </Text>
                      {place.type && (
                        <Text style={[styles.recPlaceType, { color: theme.colors.primary.default }]}>
                          {place.type.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    {place.reason && (
                      <Text style={[styles.recPlaceReason, { color: theme.colors.text.muted }]}>
                        {place.reason}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Day-by-Day breakdown if structured */}
            {aiResponse.days && aiResponse.days.length > 0 && aiResponse.days.map((day) => (
              <View
                key={day.dayNumber}
                style={[
                  styles.daySection,
                  {
                    backgroundColor: isDark ? '#1F1D1A' : '#FFFFFF',
                    borderColor: theme.colors.border.default,
                  },
                ]}
              >
                <Text style={[styles.dayTitle, { color: theme.colors.primary.default }]}>
                  Day {day.dayNumber}: {day.title}
                </Text>
                {(day.places || day.activities || []).map((p: any, idx: number) => (
                  <View key={idx} style={styles.placeItemRow}>
                    <Text style={[styles.timeBadge, { color: theme.colors.text.muted }]}>
                      {p.time || p.time_slot}
                    </Text>
                    <View style={styles.placeItemDetails}>
                      <Text style={[styles.placeName, { color: theme.colors.text.primary }]}>
                        {p.name || p.place}
                      </Text>
                      {Boolean(p.description || p.purpose) && (
                        <Text style={[styles.placeDescription, { color: theme.colors.text.secondary }]}>
                          {p.description || p.purpose}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {/* Travel Tips Section */}
            {aiResponse.tips && aiResponse.tips.length > 0 && (
              <View style={[styles.tipsSection, { backgroundColor: isDark ? '#1E2522' : '#EFF7F4' }]}>
                <Text style={[styles.tipsTitle, { color: theme.colors.brand.heritageGreen }]}>
                  💡 Local Travel & Metro Tips
                </Text>
                {aiResponse.tips.map((tip, tIdx) => (
                  <Text key={tIdx} style={[styles.tipItem, { color: theme.colors.text.secondary }]}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.starterSection}>
            <Text style={[styles.sectionHeading, { color: theme.colors.text.secondary }]}>
              Starter Trip Inspirations
            </Text>
            {STARTER_PROMPTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.promptCard,
                  {
                    backgroundColor: isDark ? '#24211E' : '#F6F0E6',
                    borderColor: isDark ? '#36302B' : '#E6DEC1',
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

      {/* Full Prompt Preview Modal on Long Press */}
      <Modal
        visible={Boolean(selectedHistoryPrompt)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedHistoryPrompt(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#23201C' : '#FFFFFF',
                borderColor: theme.colors.border.default,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.colors.primary.default }]}>
                ✨ Full AI Prompt
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedHistoryPrompt(null)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#302B26' : '#ECE5DA' }]}
              >
                <Text style={[styles.modalCloseText, { color: theme.colors.text.secondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={true}>
              <Text style={[styles.modalBodyText, { color: theme.colors.text.primary }]}>
                {selectedHistoryPrompt}
              </Text>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.colors.border.default }]}
                onPress={() => setSelectedHistoryPrompt(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.text.secondary }]}>
                  Close
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: theme.colors.primary.default }]}
                onPress={() => {
                  if (selectedHistoryPrompt) {
                    const p = selectedHistoryPrompt;
                    setSelectedHistoryPrompt(null);
                    setAiPrompt(p);
                    submitAIPrompt(p);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitText}>Hit Go ✨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Attachment Picker Modal */}
      <AttachmentPickerModal
        visible={attachmentModalVisible}
        onClose={() => setAttachmentModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
  },
  zone1HeaderArea: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    marginTop: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  promptInputContainer: {
    marginHorizontal: 16,
  },
  promptInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    gap: 10,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '400',
    paddingVertical: 4,
    textAlignVertical: 'center',
  },
  clearBtn: {
    padding: 2,
  },
  clearBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
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
    flex: 1,
    marginTop: 10,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 12,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  historySection: {
    marginTop: 4,
    marginBottom: 4,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  historyIcon: {
    fontSize: 14,
  },
  historyText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
  },
  historyActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  starterSection: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  promptCard: {
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  promptBody: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  itineraryCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  itineraryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itineraryTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  itinerarySummary: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  daySection: {
    marginTop: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  placeItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  timeBadge: {
    fontSize: 12,
    fontWeight: '700',
    width: 68,
  },
  placeItemDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 13,
    fontWeight: '600',
  },
  placeDescription: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },
  budgetBadge: {
    fontSize: 11.5,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
    overflow: 'hidden',
  },
  recommendedSection: {
    marginTop: 6,
    gap: 6,
  },
  recPlaceCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  recPlaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recPlaceName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  recPlaceType: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  recPlaceReason: {
    fontSize: 12,
    lineHeight: 16,
  },
  tipsSection: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipItem: {
    fontSize: 12,
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBodyScroll: {
    maxHeight: 280,
    marginVertical: 8,
  },
  modalBodyText: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
