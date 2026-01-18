<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useItems } from './composables/useItems';

const { initialize } = useItems();

onMounted(async () => {
  try {
    await initialize();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});
</script>

<style>
/* Global styles */
</style>
