import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/themeContext';

interface LegalTermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({ visible, onClose }) => {
  const { theme, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#23211F' : '#FAF6EE',
                  borderColor: isDark ? '#38332E' : '#E5DDD1',
                },
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <Feather name="file-text" size={20} color={theme.colors.primary.default} />
                  <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    Legal & Terms of Service
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: isDark ? '#2E2A26' : '#ECE5D8' }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Terms Content */}
              <ScrollView
                style={styles.scrollArea}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={[styles.sectionHeading, { color: theme.colors.primary.default }]}>
                  1. Acceptance of Terms
                </Text>
                <Text style={[styles.bodyText, { color: theme.colors.text.secondary }]}>
                  By accessing or using the Ghumo mobile application, AI trip planners, and map services, you agree to be bound by these terms. Ghumo provides real-time travel discovery, curated landmarks, itineraries, and geolocation assistance.
                </Text>

                <Text style={[styles.sectionHeading, { color: theme.colors.primary.default }]}>
                  2. AI-Generated Itineraries & Recommendations
                </Text>
                <Text style={[styles.bodyText, { color: theme.colors.text.secondary }]}>
                  Itineraries and recommendations are generated using Ghumo AI and verified travel data sources. Operating hours, ticket prices, and routes may change dynamically; travelers are advised to verify local conditions.
                </Text>

                <Text style={[styles.sectionHeading, { color: theme.colors.primary.default }]}>
                  3. Privacy & Local Storage
                </Text>
                <Text style={[styles.bodyText, { color: theme.colors.text.secondary }]}>
                  Your privacy is paramount. Search history and AI prompts are stored locally on your device for caching and offline retrieval. Geolocation data is used solely for map centering and local landmark distance calculation.
                </Text>

                <Text style={[styles.sectionHeading, { color: theme.colors.primary.default }]}>
                  4. User Feedback & Community
                </Text>
                <Text style={[styles.bodyText, { color: theme.colors.text.secondary }]}>
                  Ratings and reviews submitted help improve travel quality for all users. You agree not to submit fraudulent or misleading ratings.
                </Text>
              </ScrollView>

              {/* Dismiss Button */}
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: theme.colors.primary.default }]}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneButtonText}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    marginVertical: 12,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 6,
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  doneButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
