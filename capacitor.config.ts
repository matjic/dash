import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.matj.dash',
  appName: 'Dash',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_default',
      iconColor: '#488AFF',
    },
  },
};

export default config;
