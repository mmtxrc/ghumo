/**
 * Dynamic Bottom Bar Component
 * - Smooth morphing between AI prompt and Search inputs.
 * - Keyboard-adaptive floating on mobile devices.
 * - Draggable vertical expansion into full discovery & prompt overlay sheets.
 * - Field clear '✕' button when text is present.
 * - Constrained, centered layout on wide screens.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Keyboard,
  Dimensions,
  PanResponder,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useTheme } from '@/context/themeContext';
import { useHome } from '@/context/homeContext';
import { AttachmentPickerModal } from './AttachmentPickerModal';
import { SearchExpandedSheet } from './SearchExpandedSheet';
import { AIPromptExpandedSheet } from './AIPromptExpandedSheet';

export const DynamicBottomBar: React.FC = () => {
  const { theme, isDark } = useTheme();
  const {
    activeMode,
    setActiveMode,
    isExpanded,
    setIsExpanded,
    searchQuery,
    setSearchQuery,
    clearSearchQuery,
    aiPrompt,
    setAiPrompt,
    clearAiPrompt,
    performSearch,
    submitAIPrompt,
  } = useHome();

  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const aiInputRef = useRef<TextInput>(null);

  // Animation values
  const modeAnim = useRef(new Animated.Value(activeMode === 'ai' ? 1 : 0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  const hasPromptText = aiPrompt.trim().length > 0;
  const hasSearchText = searchQuery.trim().length > 0;

  // Keyboard listener for mobile floating behavior
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const height = e?.endCoordinates?.height || 260;
      Animated.spring(keyboardOffset, {
        toValue: height - (Platform.OS === 'ios' ? 10 : 0),
        damping: 20,
        stiffness: 220,
        useNativeDriver: false,
      }).start();
    };

    const onHide = () => {
      Animated.spring(keyboardOffset, {
        toValue: 0,
        damping: 20,
        stiffness: 220,
        useNativeDriver: false,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  // Mode change animation
  useEffect(() => {
    Animated.spring(modeAnim, {
      toValue: activeMode === 'ai' ? 1 : 0,
      damping: 18,
      stiffness: 180,
      mass: 0.7,
      useNativeDriver: false,
    }).start();

    if (activeMode === 'ai') {
      setTimeout(() => aiInputRef.current?.focus(), 150);
    } else {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [activeMode, modeAnim]);

  // PanResponder on handle to expand/minimize sheet
  const handlePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy < -20 && !isExpanded) {
        setIsExpanded(true);
      } else if (gestureState.dy > 20 && isExpanded) {
        setIsExpanded(false);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy < -15) {
        setIsExpanded(true);
      } else if (gestureState.dy > 15) {
        setIsExpanded(false);
      }
    },
  });

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      Keyboard.dismiss();
    }
  };

  const handleSendOrSearchClick = () => {
    if (activeMode === 'ai') {
      if (hasPromptText) {
        submitAIPrompt(aiPrompt);
        Keyboard.dismiss();
      } else {
        setActiveMode('search');
      }
    } else {
      handleSearchSubmit();
    }
  };

  // Dimensions & Width calculation (constrained on wide screens)
  const screenWidth = Dimensions.get('window').width;
  const containerMaxWidth = Math.min(screenWidth - 32, 480);

  const leftWidth = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, containerMaxWidth - 62],
  });

  const rightWidth = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [containerMaxWidth - 62, 50],
  });

  const leftBorderRadius = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 18],
  });

  const rightBorderRadius = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 25],
  });

  const searchContentOpacity = modeAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0, 0],
  });

  const aiContentOpacity = modeAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        {
          bottom: keyboardOffset,
        },
      ]}
    >
      {/* Vertically Expanded Sheet Overlay (when expanded) */}
      {isExpanded && (
        <View style={styles.expandedSheetWrapper}>
          {activeMode === 'search' ? <SearchExpandedSheet /> : <AIPromptExpandedSheet />}
        </View>
      )}

      {/* Main Bottom Bar Row (Aligned horizontally on same axis) */}
      <View style={[styles.barRow, { maxWidth: containerMaxWidth }]}>
        {/* ================= LEFT ELEMENT: AI BUTTON / PROMPT WINDOW ================= */}
        <Animated.View
          style={[
            styles.animatedBox,
            {
              width: leftWidth,
              borderRadius: leftBorderRadius,
              backgroundColor: isDark ? '#1E1C1A' : theme.colors.background.surface,
              borderColor: activeMode === 'ai' ? theme.colors.primary.default : theme.colors.border.default,
              borderWidth: activeMode === 'ai' ? 1.5 : 1,
            },
          ]}
        >
          {activeMode === 'search' ? (
            /* Circular AI Button in Search Mode */
            <TouchableOpacity
              style={styles.circleContent}
              activeOpacity={0.8}
              onPress={() => setActiveMode('ai')}
              accessibilityRole="button"
              accessibilityLabel="Switch to AI prompt mode"
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill={theme.colors.primary.default}
                  stroke={theme.colors.primary.default}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="11" r="2" fill="#FFFFFF" />
              </Svg>
            </TouchableOpacity>
          ) : (
            /* Expanded AI Prompt Window in AI Mode */
            <Animated.View style={[styles.expandedContent, { opacity: aiContentOpacity }]}>
              {/* Draggable Handle Bar */}
              <View {...handlePanResponder.panHandlers} style={styles.handleContainer}>
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} hitSlop={{ top: 8, bottom: 8, left: 20, right: 20 }}>
                  <View style={[styles.handleBar, { backgroundColor: isDark ? '#4A443F' : '#DED8D1' }]} />
                </TouchableOpacity>
              </View>

              {/* Input Row: [+] Button + Multiline Prompt Input + Clear [✕] */}
              <View style={styles.inputInnerRow}>
                <TouchableOpacity
                  style={[styles.plusButton, { backgroundColor: isDark ? '#2E2B27' : '#F0EBE1' }]}
                  activeOpacity={0.7}
                  onPress={() => setAttachmentModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Add attachment or media"
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary.default} strokeWidth="2.5" strokeLinecap="round">
                    <Line x1="12" y1="5" x2="12" y2="19" />
                    <Line x1="5" y1="12" x2="19" y2="12" />
                  </Svg>
                </TouchableOpacity>

                <TextInput
                  ref={aiInputRef}
                  style={[styles.textInput, { color: theme.colors.text.primary }]}
                  placeholder="Type a prompt"
                  placeholderTextColor={theme.colors.text.muted}
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  multiline
                  autoCapitalize="sentences"
                  blurOnSubmit={false}
                  selectionColor={theme.colors.primary.default}
                />

                {/* Clear '✕' button whenever text is present */}
                {hasPromptText && (
                  <TouchableOpacity
                    onPress={clearAiPrompt}
                    style={styles.clearButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Clear prompt text"
                  >
                    <View style={[styles.clearBadge, { backgroundColor: isDark ? '#35312D' : '#E8E2D8' }]}>
                      <Text style={[styles.clearBadgeText, { color: theme.colors.text.secondary }]}>✕</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* ================= RIGHT ELEMENT: SEARCH INPUT / DYNAMIC ACTION BUTTON ================= */}
        <Animated.View
          style={[
            styles.animatedBox,
            {
              width: rightWidth,
              borderRadius: rightBorderRadius,
              backgroundColor: isDark ? '#1E1C1A' : theme.colors.background.surface,
              borderColor: activeMode === 'search' ? theme.colors.primary.default : theme.colors.border.default,
              borderWidth: activeMode === 'search' ? 1.5 : 1,
            },
          ]}
        >
          {activeMode === 'ai' ? (
            /* Dynamic Action Button in AI Mode: Morph between Search (🔍) and Send (➤) */
            <TouchableOpacity
              style={styles.circleContent}
              activeOpacity={0.8}
              onPress={handleSendOrSearchClick}
              accessibilityRole="button"
              accessibilityLabel={hasPromptText ? 'Send AI prompt' : 'Switch to search mode'}
            >
              {hasPromptText ? (
                /* Terracotta Send Icon */
                <View style={[styles.sendCircle, { backgroundColor: theme.colors.primary.default }]}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 12h14" />
                    <Path d="m12 5 7 7-7 7" />
                  </Svg>
                </View>
              ) : (
                /* Search Icon (reverts back to search) */
                <View>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.colors.text.primary} strokeWidth="2.2" strokeLinecap="round">
                    <Circle cx="11" cy="11" r="8" />
                    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </Svg>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            /* Expanded Search Bar in Search Mode */
            <Animated.View style={[styles.expandedContent, { opacity: searchContentOpacity }]}>
              {/* Draggable Handle Bar */}
              <View {...handlePanResponder.panHandlers} style={styles.handleContainer}>
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} hitSlop={{ top: 8, bottom: 8, left: 20, right: 20 }}>
                  <View style={[styles.handleBar, { backgroundColor: isDark ? '#4A443F' : '#DED8D1' }]} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputInnerRow}>
                <TextInput
                  ref={searchInputRef}
                  style={[styles.textInput, { color: theme.colors.text.primary }]}
                  placeholder="Search"
                  placeholderTextColor={theme.colors.text.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={handleSearchSubmit}
                  autoCapitalize="words"
                  selectionColor={theme.colors.primary.default}
                />

                {/* Clear '✕' button whenever search text is present */}
                {hasSearchText && (
                  <TouchableOpacity
                    onPress={clearSearchQuery}
                    style={styles.clearButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Clear search text"
                  >
                    <View style={[styles.clearBadge, { backgroundColor: isDark ? '#35312D' : '#E8E2D8' }]}>
                      <Text style={[styles.clearBadgeText, { color: theme.colors.text.secondary }]}>✕</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {hasSearchText && (
                  <TouchableOpacity
                    onPress={handleSearchSubmit}
                    style={[styles.searchSubmitIcon, { backgroundColor: theme.colors.primary.default }]}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
                      <Path d="M5 12h14" />
                      <Path d="m12 5 7 7-7 7" />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* Attachment Picker Modal */}
      <AttachmentPickerModal
        visible={attachmentModalVisible}
        onClose={() => setAttachmentModalVisible(false)}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  expandedSheetWrapper: {
    width: '100%',
    maxWidth: 480,
    marginBottom: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  animatedBox: {
    height: 54,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  circleContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 3,
    paddingBottom: 2,
  },
  handleBar: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  plusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 4,
    fontWeight: '400',
  },
  clearButton: {
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
  searchSubmitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
