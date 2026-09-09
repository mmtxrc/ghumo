import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import { useTheme } from '@/context/themeContext';
import { BrandHeader } from '@/components/auth/BrandHeader';
import { AuthCard } from '@/components/auth/AuthCard';

export default function HomeScreen() {
  const { user, isAuthenticated, isGuest, logout } = useAuth();
  const { theme, isDark, fadeAnim } = useTheme();

  // If user is not logged in and has not skipped login -> render Revamped Auth Screen
  if (!isAuthenticated && !isGuest) {
    return (
      <Animated.View style={[styles.screenRoot, { backgroundColor: theme.colors.background.hero, opacity: fadeAnim }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'light-content'}
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
      </Animated.View>
    );
  }

  // When logged in or skipped -> render Home Page
  return (
    <Animated.View style={[styles.homeRoot, { backgroundColor: theme.colors.background.screen, opacity: fadeAnim }]}>
      <SafeAreaView style={[styles.homeContainer, { backgroundColor: theme.colors.background.screen }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background.screen}
        />
        <View style={styles.homeContent}>
          <Text style={[styles.homeText, { color: theme.colors.text.primary }]}>home page</Text>

          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: theme.colors.background.surface,
                borderColor: theme.colors.border.default,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.colors.text.secondary }]}>
              {isAuthenticated
                ? `Logged in as: ${user?.email || 'User'}`
                : 'Browsing as Guest'}
            </Text>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: theme.colors.primary.default }]}
              onPress={logout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutButtonText}>
                {isAuthenticated ? 'Log Out' : 'Back to Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
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
  },
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    width: '100%',
  },
  homeText: {
    fontSize: 26,
    fontWeight: '700',
    textTransform: 'lowercase',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  statusCard: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 2,
  },
  logoutButtonText: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
