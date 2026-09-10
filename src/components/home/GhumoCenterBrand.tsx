import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { useTheme } from '@/context/themeContext';

export const GhumoCenterBrand: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.logoWrapper}>
        <Image
          source={require('@/assets/images/ghumo-logo-standalone.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.tagline, { color: theme.colors.text.secondary }]}>
        Travel More. Belong Anywhere.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  logoWrapper: {
    width: 240,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: 0.3,
    textAlign: 'center',
    opacity: 0.85,
  },
});
