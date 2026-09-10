import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import { useTheme } from '@/context/themeContext';
import { logger } from '@/utils/logger';
import { BrandHeader } from '@/components/auth/BrandHeader';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLoadingOverlay } from '@/components/auth/AuthLoadingOverlay';
import { MapBackground } from '@/components/home/MapBackground';
import { GhumoCenterBrand } from '@/components/home/GhumoCenterBrand';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import { DynamicBottomBar } from '@/components/home/DynamicBottomBar';
import { HomeFeedResults } from '@/components/home/HomeFeedResults';

export default function HomeScreen() {
  const { isAuthenticated, isGuest } = useAuth();
  const { theme, isDark, fadeAnim } = useTheme();

  useEffect(() => {
    logger.app('HomeScreen active state', { isAuthenticated, isGuest });
  }, [isAuthenticated, isGuest]);

  // If user is not logged in and has not skipped login -> render Revamped Auth Screen
  if (!isAuthenticated && !isGuest) {
    return (
      <Animated.View style={[styles.screenRoot, { backgroundColor: theme.colors.background.hero, opacity: fadeAnim }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.background.hero}
        />
        <SafeAreaView style={[styles.topSafeArea, { backgroundColor: theme.colors.background.hero }]} />

        <KeyboardAvoidingView
          enabled={Platform.OS === 'ios'}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.keyboardAvoid, { backgroundColor: theme.colors.background.screen }]}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.colors.background.screen }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
            bounces={false}
          >
            {/* Top Brand Header Area matching Card Width & Theme Hero Background */}
            <View style={[styles.heroSection, { backgroundColor: theme.colors.background.hero }]}>
              <BrandHeader />
            </View>

            {/* Warm Ivory / Dark Charcoal Auth Card */}
            <View style={[styles.cardSection, { backgroundColor: theme.colors.background.screen }]}>
              <AuthCard />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <AuthLoadingOverlay />
      </Animated.View>
    );
  }

  // When logged in or skipped -> render Home Page
  return (
    <Animated.View style={[styles.homeRoot, { backgroundColor: theme.colors.background.screen, opacity: fadeAnim }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.screen}
      />

      {/* Layer 1: Background Map View Placeholder (prepared for MapView in next step) */}
      <MapBackground />

      {/* Layer 2: Floating Top App Bar */}
      <HomeTopBar />

      {/* Layer 3: Search & AI Results Card (when active) */}
      <HomeFeedResults />

      {/* Layer 5: Dynamic Morphing Bottom Bar (AI + Search) */}
      <DynamicBottomBar />

      {/* Layer 6: Auth Action Loading Overlay */}
      <AuthLoadingOverlay />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  topSafeArea: {
    flex: 0,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 0,
  },
  cardSection: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  homeRoot: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
