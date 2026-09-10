/**
 * Map Background Layer
 * Prepared architecture placeholder for full-screen MapView integration in the next step.
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect, Circle, Line } from 'react-native-svg';
import { useTheme } from '@/context/themeContext';

export const MapBackground: React.FC = () => {
  const { isDark } = useTheme();
  const { width, height } = Dimensions.get('window');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Background SVG Grid & Ambient Topography simulating Map Layers */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={isDark ? '#262320' : '#EDE6DC'}
              strokeWidth="0.8"
              strokeDasharray="2,3"
            />
          </Pattern>
        </Defs>

        {/* Base map surface */}
        <Rect width="100%" height="100%" fill={isDark ? '#141312' : '#FBF7F2'} />
        <Rect width="100%" height="100%" fill="url(#mapGrid)" />

        {/* Ambient Topographic Map Contour Curves */}
        <Path
          d={`M -50 ${height * 0.35} C 100 ${height * 0.28}, 220 ${height * 0.45}, ${width + 50} ${height * 0.32}`}
          fill="none"
          stroke={isDark ? '#2E2A26' : '#E5DDD1'}
          strokeWidth="1.2"
        />
        <Path
          d={`M -50 ${height * 0.45} C 120 ${height * 0.38}, 240 ${height * 0.55}, ${width + 50} ${height * 0.42}`}
          fill="none"
          stroke={isDark ? '#282421' : '#ECE4D8'}
          strokeWidth="1"
        />
        <Path
          d={`M -50 ${height * 0.65} C 80 ${height * 0.58}, 260 ${height * 0.72}, ${width + 50} ${height * 0.62}`}
          fill="none"
          stroke={isDark ? '#25221F' : '#EFE9DE'}
          strokeWidth="1"
        />

        {/* Subtle Map Pin Dots */}
        <Circle cx={width * 0.22} cy={height * 0.38} r="3" fill="#C25732" opacity={0.4} />
        <Circle cx={width * 0.78} cy={height * 0.48} r="3" fill="#E7A44B" opacity={0.4} />
        <Circle cx={width * 0.48} cy={height * 0.68} r="3" fill="#2E6F62" opacity={0.35} />
      </Svg>
    </View>
  );
};
