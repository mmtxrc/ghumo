/**
 * Dynamic Bottom Bar Component
 * - 1:1 Calculated interactive dragging with pan gesture.
 * - Perfectly centered expansion for Search View, Prompt View, and Attachment Picker.
 * - Snug positioning directly above keyboard (0 bottom gap when active).
 * - Smooth continuous morphing between Search and AI action buttons and inputs.
 * - Seamless keyboard focus transfer between Search and AI modes without keyboard dismissal.
 * - Dynamic single-to-multiline prompt input with max 500-char limit, displaying all text cleanly without scrolling or clipping.
 * - Morphing attachment picker view inside the animated card on '+' click.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { AttachmentPickerView } from './AttachmentPickerView';
import { SearchView } from './SearchView';
import { PromptView } from './PromptView';

const RESTING_HEIGHT = 58;
const ACTION_BUTTON_SIZE = 58;
const MAX_PROMPT_LENGTH = 500;

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
    addAttachment,
    performSearch,
    submitAIPrompt,
  } = useHome();

  const [isAttachmentPickerOpen, setIsAttachmentPickerOpen] = useState(false);
  const [promptBoxHeight, setPromptBoxHeight] = useState(RESTING_HEIGHT);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const searchInputRef = useRef<TextInput>(null);
  const aiInputRef = useRef<TextInput>(null);

  // Animation values
  const modeAnim = useRef(new Animated.Value(activeMode === 'ai' ? 1 : 0)).current;
  const dragProgress = useRef(new Animated.Value(0)).current;
  const currentProgress = useRef(0);
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  // Track progress value synchronously
  useEffect(() => {
    const id = dragProgress.addListener(({ value }) => {
      currentProgress.current = value;
    });
    return () => dragProgress.removeListener(id);
  }, [dragProgress]);

  const hasPromptText = aiPrompt.trim().length > 0;
  const hasSearchText = searchQuery.trim().length > 0;

  // Screen calculations
  // Shared horizontal geometry keeps this bar aligned with the header.
  const windowDims = Dimensions.get('window');
  const screenWidth = windowDims.width;
  const screenHeight = windowDims.height;

  const CONTENT_MAX_WIDTH = 520;
  const HORIZONTAL_MARGIN = 24;

  const containerMaxWidth = Math.min(
    CONTENT_MAX_WIDTH,
    screenWidth - HORIZONTAL_MARGIN * 2
  );

  const restingInputWidth =
    containerMaxWidth - ACTION_BUTTON_SIZE - 12;

  const expandedOverlayHeight = Math.min(screenHeight * 0.90, 760);
  const ATTACHMENT_PICKER_HEIGHT = Math.min(screenHeight * 0.55, 310);
  const DRAG_DISTANCE = screenHeight * 0.55;

  // Helper to animate expansion state smoothly
  const animateTo = useCallback((toValue: number) => {
    setIsExpanded(toValue === 1);
    if (toValue === 0) {
      setIsAttachmentPickerOpen(false);
    }
    if (toValue === 1) {
      Keyboard.dismiss();
    }
    Animated.spring(dragProgress, {
      toValue,
      damping: 24,
      stiffness: 220,
      mass: 0.75,
      useNativeDriver: false,
    }).start();
  }, [dragProgress, setIsExpanded]);

  // Sync isExpanded state if changed externally
  useEffect(() => {
    if (isExpanded && currentProgress.current < 0.9) {
      animateTo(1);
    } else if (!isExpanded && currentProgress.current > 0.1) {
      animateTo(0);
    }
  }, [isExpanded, animateTo]);

  // Keyboard listener for mobile floating behavior (snug above keyboard with 0-2px gap)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      setIsKeyboardOpen(true);
      const height = e?.endCoordinates?.height || 260;
      Animated.spring(keyboardOffset, {
        toValue: height,
        damping: 24,
        stiffness: 260,
        useNativeDriver: false,
      }).start();
    };

    const onHide = () => {
      setIsKeyboardOpen(false);
      Animated.spring(keyboardOffset, {
        toValue: 0,
        damping: 24,
        stiffness: 260,
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

  // Mode change animation with seamless focus transfer
  useEffect(() => {
    Animated.spring(modeAnim, {
      toValue: activeMode === 'ai' ? 1 : 0,
      damping: 22,
      stiffness: 200,
      mass: 0.7,
      useNativeDriver: false,
    }).start();
  }, [activeMode, modeAnim]);

  const switchMode = (newMode: 'search' | 'ai') => {
    setActiveMode(newMode);
    if (newMode === 'ai') {
      setTimeout(() => aiInputRef.current?.focus(), 40);
    } else {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  };

  // Trigger expansion into attachment picker view
  const handleOpenAttachmentPicker = () => {
    setIsAttachmentPickerOpen(true);
    animateTo(1);
  };

  // Continuous 1:1 PanResponder for dragging and swiping up/down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        dragProgress.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (currentProgress.current < 0.5) {
          // Dragging up from bottom rest
          const progress = Math.max(0, Math.min(1, -gestureState.dy / DRAG_DISTANCE));
          dragProgress.setValue(progress);
        } else {
          // Dragging down from expanded overlay
          const progress = Math.max(0, Math.min(1, 1 - gestureState.dy / DRAG_DISTANCE));
          dragProgress.setValue(progress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (currentProgress.current < 0.5) {
          // Releasing during expansion attempt
          if (gestureState.vy < -0.35 || currentProgress.current > 0.3) {
            animateTo(1);
          } else {
            animateTo(0);
          }
        } else {
          // Releasing during collapse attempt
          if (gestureState.vy > 0.35 || currentProgress.current < 0.7) {
            animateTo(0);
          } else {
            animateTo(1);
          }
        }
      },
    })
  ).current;

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
    animateTo(1);
  };

  const handleSendOrActionClick = () => {
    if (activeMode === 'ai') {
      if (hasPromptText) {
        submitAIPrompt(aiPrompt);
        animateTo(1);
      } else {
        switchMode('search');
      }
    } else {
      handleSearchSubmit();
    }
  };

  // ================= MODE INTERPOLATIONS (Horizontal Morphing) =================
  const leftRestingWidth = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [ACTION_BUTTON_SIZE, restingInputWidth],
  });

  const rightRestingWidth = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [restingInputWidth, ACTION_BUTTON_SIZE],
  });

  const leftBorderRadius = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 28],
  });

  const rightBorderRadius = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 18],
  });

  const leftButtonContentOpacity = modeAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0, 0],
  });

  const leftInputContentOpacity = modeAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  const rightInputContentOpacity = modeAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0, 0],
  });

  const rightButtonContentOpacity = modeAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  // Dedicated expanded height for attachment picker vs full PromptView / SearchView
  const leftExpandedHeight = isAttachmentPickerOpen
    ? ATTACHMENT_PICKER_HEIGHT
    : expandedOverlayHeight;

  // Card Height & Width expansion
  const leftCardHeight = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [activeMode === 'ai' ? promptBoxHeight : ACTION_BUTTON_SIZE, leftExpandedHeight],
  });

  const rightCardHeight = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [activeMode === 'search' ? RESTING_HEIGHT : ACTION_BUTTON_SIZE, expandedOverlayHeight],
  });

  // Width & Centering: When expanding, active card smoothly expands to containerMaxWidth and centers
  const leftCardWidth = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [activeMode === 'ai' ? restingInputWidth : ACTION_BUTTON_SIZE, containerMaxWidth],
  });

  const rightCardWidth = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [activeMode === 'search' ? restingInputWidth : ACTION_BUTTON_SIZE, containerMaxWidth],
  });

  // Centering translation:
  // The inactive button plus the 12px gap occupies 70px.
  // Move the active card by half of that space so the expanded
  // card lands exactly on the center of the shared container.
  const inactiveSpace = ACTION_BUTTON_SIZE + 12;
  const centerShift = inactiveSpace / 2;

  const searchCardTranslateX = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -centerShift],
  });

  const aiCardTranslateX = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, centerShift],
  });

  // Slide-out for the inactive action button
  const aiModeInactiveButtonTranslateX = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const searchModeInactiveButtonTranslateX = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120],
  });

  const inactiveButtonOpacity = dragProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0, 0],
  });

  const restingContentOpacity = dragProgress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [1, 0, 0],
  });

  const expandedContentOpacity = dragProgress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });

  const scrimOpacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  return (
    <>
      {/* Full Backdrop Scrim */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.scrimBackdrop,
          { opacity: scrimOpacity },
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => animateTo(0)}
        />
      </Animated.View>

      {/* Main Bottom Container (Snug directly above keyboard with 0px gap when keyboard is open) */}
      <Animated.View
        style={[
          styles.outerContainer,
          {
            bottom: keyboardOffset,
            paddingBottom: isKeyboardOpen ? 0 : (Platform.OS === 'ios' ? 24 : 16),
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={[styles.barRow, { maxWidth: containerMaxWidth }]} pointerEvents="box-none">
          {/* ================= LEFT ELEMENT: AI BUTTON / AI PROMPT FIELD ================= */}
          <Animated.View
            {...(activeMode === 'ai' ? panResponder.panHandlers : {})}
            style={[
              styles.animatedBox,
              {
                width: activeMode === 'ai' ? leftCardWidth : leftRestingWidth,
                height: activeMode === 'ai' ? leftCardHeight : ACTION_BUTTON_SIZE,
                borderRadius: leftBorderRadius,
                transform: [
                  {
                    translateX: activeMode === 'ai'
                      ? aiCardTranslateX
                      : searchModeInactiveButtonTranslateX,
                  },
                ],
                opacity: activeMode === 'ai' ? 1 : inactiveButtonOpacity,
                backgroundColor: isDark ? '#1D1B19' : theme.colors.background.surface,
                borderColor: activeMode === 'ai' ? theme.colors.primary.default : theme.colors.border.default,
                borderWidth: activeMode === 'ai' ? 1.5 : 1,
                zIndex: activeMode === 'ai' ? 50 : 10,
              },
            ]}
          >
            {activeMode === 'search' ? (
              /* Circular AI Button in Search Mode */
              <Animated.View style={[styles.fullFlexCenter, { opacity: leftButtonContentOpacity }]}>
                <TouchableOpacity
                  style={styles.actionButtonTouch}
                  activeOpacity={0.8}
                  onPress={() => switchMode('ai')}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to AI prompt mode"
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                      fill={theme.colors.primary.default}
                      stroke={theme.colors.primary.default}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle cx="12" cy="11" r="2.2" fill="#FFFFFF" />
                  </Svg>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              /* Expanded AI Prompt Window in AI Mode */
              <View style={styles.fullFlex}>
                {/* Top Handle Indicator (Absolute top so it doesn't disturb vertical flex centering) */}
                <View style={styles.handleContainer} pointerEvents="none">
                  <View style={[styles.handleBar, { backgroundColor: isDark ? '#4A443F' : '#DED8D1' }]} />
                </View>

                {/* Resting Bar Content (Dynamic 1-to-multiline prompt input displaying all text) */}
                <Animated.View
                  style={[
                    styles.restingPromptRow,
                    {
                      opacity: Animated.multiply(leftInputContentOpacity, restingContentOpacity),
                    },
                  ]}
                  pointerEvents={isExpanded ? 'none' : 'auto'}
                >
                  {/* '+' Attachment Button - Transforms into Attachment Picker on click */}
                  <View style={styles.plusCenterWrapper}>
                    <TouchableOpacity
                      style={[styles.plusButton, { backgroundColor: isDark ? '#2B2824' : '#EFE8DE' }]}
                      activeOpacity={0.7}
                      onPress={handleOpenAttachmentPicker}
                      accessibilityRole="button"
                      accessibilityLabel="Add attachment or media"
                    >
                      <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary.default} strokeWidth="2.6" strokeLinecap="round">
                        <Line x1="12" y1="5" x2="12" y2="19" />
                        <Line x1="5" y1="12" x2="19" y2="12" />
                      </Svg>
                    </TouchableOpacity>
                  </View>

                  {/* Multiline TextInput with max 500-char limit, dynamic height, and no clipping */}
                  <TextInput
                    ref={aiInputRef}
                    style={[styles.aiTextInput, { color: theme.colors.text.primary }]}
                    placeholder="Ask Ghumo AI or swipe up..."
                    placeholderTextColor={theme.colors.text.muted}
                    value={aiPrompt}
                    maxLength={MAX_PROMPT_LENGTH}
                    onChangeText={(text) => {
                      const trimmed = text.slice(0, MAX_PROMPT_LENGTH);
                      setAiPrompt(trimmed);
                      if (!trimmed || trimmed.trim().length === 0) {
                        setPromptBoxHeight(RESTING_HEIGHT);
                      }
                    }}
                    onContentSizeChange={(e) => {
                      const contentHeight = e?.nativeEvent?.contentSize?.height || 0;
                      if (!aiPrompt || aiPrompt.trim().length === 0) {
                        setPromptBoxHeight(RESTING_HEIGHT);
                      } else {
                        // Dynamically scale card height to fit every line without truncation
                        const calculatedHeight = Math.max(RESTING_HEIGHT, Math.ceil(contentHeight + 24));
                        setPromptBoxHeight(calculatedHeight);
                      }
                    }}
                    multiline={true}
                    scrollEnabled={false}
                    autoCapitalize="sentences"
                    blurOnSubmit={false}
                    selectionColor={theme.colors.primary.default}
                  />

                  {/* Clear '✕' button */}
                  {hasPromptText && (
                    <TouchableOpacity
                      onPress={() => {
                        clearAiPrompt();
                        setPromptBoxHeight(RESTING_HEIGHT);
                      }}
                      style={styles.clearButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Clear prompt text"
                    >
                      <View style={[styles.clearBadge, { backgroundColor: isDark ? '#35312D' : '#E8E2D8' }]}>
                        <Text style={[styles.clearBadgeText, { color: theme.colors.text.secondary }]}>✕</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </Animated.View>

                {/* Full-Screen Content Overlay: Morphing Attachment Picker or PromptView */}
                <Animated.View
                  style={[
                    styles.expandedContentWrapper,
                    {
                      opacity: expandedContentOpacity,
                    },
                  ]}
                  pointerEvents={isExpanded ? 'auto' : 'none'}
                >
                  {isAttachmentPickerOpen ? (
                    <AttachmentPickerView
                      onClose={() => {
                        setIsAttachmentPickerOpen(false);
                        animateTo(0);
                      }}
                      onSelect={(type, name) => {
                        addAttachment({
                          id: `att_${Date.now()}`,
                          name,
                          type,
                        });
                        setIsAttachmentPickerOpen(false);
                        animateTo(0);
                      }}
                    />
                  ) : (
                    <PromptView onClose={() => animateTo(0)} />
                  )}
                </Animated.View>
              </View>
            )}
          </Animated.View>

          {/* ================= RIGHT ELEMENT: SEARCH INPUT / ACTION BUTTON ================= */}
          <Animated.View
            {...(activeMode === 'search' ? panResponder.panHandlers : {})}
            style={[
              styles.animatedBox,
              {
                width: activeMode === 'search' ? rightCardWidth : rightRestingWidth,
                height: activeMode === 'search' ? rightCardHeight : ACTION_BUTTON_SIZE,
                borderRadius: rightBorderRadius,
                transform: [
                  {
                    translateX: activeMode === 'search'
                      ? searchCardTranslateX
                      : aiModeInactiveButtonTranslateX,
                  },
                ],
                opacity: activeMode === 'search' ? 1 : inactiveButtonOpacity,
                backgroundColor: isDark ? '#1D1B19' : theme.colors.background.surface,
                borderColor: activeMode === 'search' ? theme.colors.primary.default : theme.colors.border.default,
                borderWidth: activeMode === 'search' ? 1.5 : 1,
                zIndex: activeMode === 'search' ? 50 : 10,
              },
            ]}
          >
            {activeMode === 'ai' ? (
              /* Action Button in AI Mode: Morph between Search (🔍) and Send (➤) */
              <Animated.View style={[styles.fullFlexCenter, { opacity: rightButtonContentOpacity }]}>
                <TouchableOpacity
                  style={styles.actionButtonTouch}
                  activeOpacity={0.8}
                  onPress={handleSendOrActionClick}
                  accessibilityRole="button"
                  accessibilityLabel={hasPromptText ? 'Send AI prompt & open planner' : 'Switch to search mode'}
                >
                  {hasPromptText ? (
                    <View style={[styles.sendCircle, { backgroundColor: theme.colors.primary.default }]}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M5 12h14" />
                        <Path d="m12 5 7 7-7 7" />
                      </Svg>
                    </View>
                  ) : (
                    <View>
                      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={theme.colors.text.primary} strokeWidth="2.2" strokeLinecap="round">
                        <Circle cx="11" cy="11" r="8" />
                        <Line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ) : (
              /* Expanded Search Bar in Search Mode */
              <View style={styles.fullFlex}>
                {/* Top Handle Indicator (Absolute top) */}
                <View style={styles.handleContainer} pointerEvents="none">
                  <View style={[styles.handleBar, { backgroundColor: isDark ? '#4A443F' : '#DED8D1' }]} />
                </View>

                {/* Resting Bar Content (Contracted Search Bar) */}
                <Animated.View
                  style={[
                    styles.restingSearchRow,
                    {
                      opacity: Animated.multiply(rightInputContentOpacity, restingContentOpacity),
                    },
                  ]}
                  pointerEvents={isExpanded ? 'none' : 'auto'}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.colors.text.muted} strokeWidth="2.2" strokeLinecap="round">
                    <Circle cx="11" cy="11" r="8" />
                    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </Svg>

                  <TextInput
                    ref={searchInputRef}
                    style={[styles.searchTextInput, { color: theme.colors.text.primary }]}
                    placeholder="Search or swipe up..."
                    placeholderTextColor={theme.colors.text.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    onSubmitEditing={handleSearchSubmit}
                    scrollEnabled={false}
                    autoCapitalize="words"
                    selectionColor={theme.colors.primary.default}
                  />

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

                  <TouchableOpacity
                    onPress={handleSearchSubmit}
                    style={[styles.searchSubmitIcon, { backgroundColor: theme.colors.primary.default }]}
                    accessibilityLabel="Open search view"
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
                      <Path d="M5 12h14" />
                      <Path d="m12 5 7 7-7 7" />
                    </Svg>
                  </TouchableOpacity>
                </Animated.View>

                {/* Full-Screen Search View Overlay Content */}
                <Animated.View
                  style={[
                    styles.expandedContentWrapper,
                    {
                      opacity: expandedContentOpacity,
                    },
                  ]}
                  pointerEvents={isExpanded ? 'auto' : 'none'}
                >
                  <SearchView onClose={() => animateTo(0)} />
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  scrimBackdrop: {
    backgroundColor: '#000000',
    zIndex: 90,
  },
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 0,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    gap: 12,
  },
  animatedBox: {
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  fullFlex: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  fullFlexCenter: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTouch: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C25732',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  handleContainer: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  handleBar: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
  },
  restingPromptRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  restingSearchRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  plusCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
    lineHeight: 20,
    paddingVertical: 0,
    fontWeight: '400',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  searchTextInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
    lineHeight: 20,
    paddingVertical: 0,
    fontWeight: '400',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  searchSubmitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 0,
  },
});
