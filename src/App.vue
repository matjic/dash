<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { useItems } from './composables/useItems';
import {
  initializeShortcuts,
  setupShortcutListener,
  handleDeepLink,
} from './services/shortcutService';

const { initialize } = useItems();
const router = useRouter();

onMounted(async () => {
  try {
    await initialize();

    // Initialize Home Screen Quick Actions
    await initializeShortcuts();
    setupShortcutListener(router);

    // Listen for deep links from Siri intents
    App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
      await handleDeepLink(event.url, router);
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});
</script>

<style>
/* Global styles */
</style>
