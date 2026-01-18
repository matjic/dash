import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.matj.dash',
  appName: 'Dash',
  webDir: 'dist',
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
