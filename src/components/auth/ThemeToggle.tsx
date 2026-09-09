/**
 * Theme Toggle Button
 * Modular standalone component placed beside the pill switch.
 * Can be easily removed or relocated without breaking any business logic.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/context/themeContext';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleTheme}
      style={[
        styles.button,
        {
          backgroundColor: isDark ? '#242220' : '#F0EBE1',
          borderColor: isDark ? '#35312D' : '#E2DBD0',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        /* Sun Icon for switching to light */
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E7A44B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="5" />
          <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </Svg>
      ) : (
        /* Moon Icon for switching to dark */
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.colors.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </Svg>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
