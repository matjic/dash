import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.matj.dash',
  appName: 'Dash',
  webDir: 'dist',
  server: {
    url: 'http://localhost:5173',
    cleartext: true,
  },
  ios: {
    contentInset: 'never',
  },
  plugins: {
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_default',
      iconColor: '#488AFF',
    },
  },
};

export default config;
