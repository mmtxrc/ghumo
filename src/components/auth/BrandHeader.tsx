import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/context/themeContext';

export const BrandHeader: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1E1A15' : '#B85B3A' },
      ]}
    >
      <Image
        source={
          isDark
            ? require('@/assets/images/ghumo-banner-dark.png')
            : require('@/assets/images/ghumo-banner.png')
        }
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 440,
    aspectRatio: 292 / 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
});
