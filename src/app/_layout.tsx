import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/context/authContext';
import { ThemeProvider as GhumoThemeProvider } from '@/context/themeContext';
import { HomeProvider } from '@/context/homeContext';
import { ErrorProvider } from '@/context/errorContext';
import { AppErrorBanner } from '@/components/ui/AppErrorBanner';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <ErrorProvider>
        <GhumoThemeProvider>
          <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
              <HomeProvider>
                <AppErrorBanner />
                <AnimatedSplashOverlay />
                <AppTabs />
              </HomeProvider>
            </AuthProvider>
          </NavigationThemeProvider>
        </GhumoThemeProvider>
      </ErrorProvider>
    </SafeAreaProvider>
  );
}
