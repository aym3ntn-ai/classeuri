import type { ExpoConfig } from 'expo/config';

const { version } = require('./package.json') as { version: string };

const config: ExpoConfig = {
  name: 'Classeuri',
  slug: 'classeuri',
  version,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'classeuri',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.aym3ntn.classeuri',
    // Set by CI to the workflow run number so each build can update the previous one.
    versionCode: Number(process.env.ANDROID_VERSION_CODE ?? 1),
    adaptiveIcon: {
      backgroundColor: '#11151C',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
  },
  web: { bundler: 'metro', output: 'single' },
  plugins: [
    'expo-router',
    'expo-font',
    ['expo-splash-screen', { backgroundColor: '#11151C', image: './assets/images/splash-icon.png', imageWidth: 96 }],
    '@config-plugins/react-native-blob-util',
    '@config-plugins/react-native-pdf',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
