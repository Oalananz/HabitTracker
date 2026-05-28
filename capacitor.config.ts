import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.habitterminal.app',
  appName: 'HabitTerminal',
  webDir: 'out',

  // Point to your deployed Vercel URL
  // Change this to your actual deployment URL
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://habit-tracker-l8h2.vercel.app',
    cleartext: false,
    allowNavigation: [
      '*.supabase.co',
      '*.supabase.in',
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
    ],
  },

  ios: {
    backgroundColor: '#10141a',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'HabitTerminal',
    allowsLinkPreview: false,
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      launchFadeOutDuration: 500,
      backgroundColor: '#10141a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#10141a',
    },
    Preferences: {
      // Preferences are automatically encrypted on iOS via Keychain
    },
  },
};

export default config;
