/**
 * Map Background Layer
 * Clean architecture container prepared for OpenStreetMap (OSM) / MapView integration.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/themeContext';

export const MapBackground: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: isDark ? theme.colors.background.screen : theme.colors.background.screen },
      ]}
      pointerEvents="none"
    >
      {/* OSM / Leaflet MapView placeholder mount point */}
      <View style={StyleSheet.absoluteFill} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 0,
  },
});
