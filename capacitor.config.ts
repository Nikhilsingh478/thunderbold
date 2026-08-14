import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'shop.thunderbold.app',
  appName: 'Thunderbold',
  webDir: 'dist',
  server: {
    // Use local bundle served from Android assets via https://localhost
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    backgroundColor: '#080808',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 100,
      launchAutoHide: true,
      launchFadeOutDuration: 100,
      backgroundColor: '#080808',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'Dark',
      backgroundColor: '#080808',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
