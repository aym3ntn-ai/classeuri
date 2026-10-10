import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
  SchibstedGrotesk_700Bold,
  SchibstedGrotesk_800ExtraBold,
} from '@expo-google-fonts/schibsted-grotesk';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toast } from '@/components/Toast';
import { t } from '@/i18n';
import { useCatalog } from '@/store/catalog';
import { useDownloads } from '@/store/downloads';
import { useReading } from '@/store/reading';
import { useSettings } from '@/store/settings';
import { toast } from '@/store/toast';
import { useIsDark, useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync();

const STORES = [useSettings, useCatalog, useDownloads, useReading];

/** True once every persisted store has been read back from the device. */
function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => STORES.every((s) => s.persist.hasHydrated()));
  useEffect(() => {
    const check = () => setHydrated(STORES.every((s) => s.persist.hasHydrated()));
    const unsubscribe = STORES.map((s) => s.persist.onFinishHydration(check));
    check();
    return () => unsubscribe.forEach((u) => u());
  }, []);
  return hydrated;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_700Bold,
    SchibstedGrotesk_800ExtraBold,
    IBMPlexMono_500Medium,
  });
  const hydrated = useHydrated();
  const ready = hydrated && (fontsLoaded || fontError !== null);
  const theme = useTheme();
  const isDark = useIsDark();

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();
    // Quiet sync at launch: the cached catalog is already on screen, so a failure
    // (no network) says nothing, and only real changes are announced.
    useCatalog
      .getState()
      .sync()
      .then(({ added, updated }) => {
        if (added + updated > 0) toast(t.sync.summary(added, updated));
      })
      .catch(() => {});
  }, [ready]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.bg);
  }, [theme.bg]);

  if (!ready) return null;

  const base = isDark ? DarkTheme : DefaultTheme;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider
          value={{ ...base, colors: { ...base.colors, background: theme.bg, card: theme.surface, text: theme.ink, border: theme.line } }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="viewer" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
          <Toast />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
