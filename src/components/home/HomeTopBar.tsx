import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/authContext';
import { useTheme } from '@/context/themeContext';
import { ThemeToggle } from '../auth/ThemeToggle';

export const HomeTopBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, isDark } = useTheme();

  // Dynamic top offset: accounts for status bar insets on Android & iOS, with a clean top margin
  const topInset = insets.top > 0
    ? insets.top + (Platform.OS === 'android' ? 8 : 4)
    : (Platform.OS === 'web' ? 12 : 16);

  return (
    <View style={[styles.outerWrapper, { paddingTop: topInset }]} pointerEvents="box-none">
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(27,26,24,0.95)' : 'rgba(255,253,249,0.95)',
            borderColor: theme.colors.border.default,
          },
        ]}
      >
        {/* User Status / Identity */}
        <View style={styles.userBadge}>
          <View style={[styles.statusDot, { backgroundColor: theme.colors.primary.default }]} />
          <Text style={[styles.userText, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {isAuthenticated ? user?.email?.split('@')[0] || 'Traveler' : 'Guest Traveler'}
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.rightActions}>
          <ThemeToggle />
          <TouchableOpacity
            style={[
              styles.authButton,
              {
                backgroundColor: isDark ? '#242220' : '#F0EBE1',
                borderColor: isDark ? '#35312D' : '#E2DBD0',
              },
            ]}
            onPress={logout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isAuthenticated ? 'Log Out' : 'Login'}
          >
            <Text style={[styles.authButtonText, { color: theme.colors.text.secondary }]}>
              {isAuthenticated ? 'Log Out' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    zIndex: 99,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
  container: {
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 520,
    alignSelf: 'center',
    width: '92%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authButton: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
