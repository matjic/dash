<template>
  <ion-segment :value="modelValue" @ionChange="onChange">
    <ion-segment-button value="all">
      <ion-label>All</ion-label>
    </ion-segment-button>
    <ion-segment-button value="tasks">
      <ion-label>Tasks</ion-label>
    </ion-segment-button>
    <ion-segment-button value="events">
      <ion-label>Events</ion-label>
    </ion-segment-button>
  </ion-segment>
</template>

<script setup lang="ts">
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/vue';
import type { FilterType } from '../composables/useItems';

defineProps<{
  modelValue: FilterType;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: FilterType];
}>();

function onChange(event: CustomEvent) {
  emit('update:modelValue', event.detail.value as FilterType);
}
</script>

<style scoped>
ion-segment {
  --background: transparent;
  min-height: 32px;
}

ion-segment-button {
  --background: transparent;
  --background-checked: rgba(0, 0, 0, 0.08);
  --background-hover: rgba(0, 0, 0, 0.04);
  --color: var(--ion-text-color);
  --color-checked: var(--ion-text-color);
  --border-radius: 16px;
  --indicator-box-shadow: none;
  --indicator-color: transparent;
  --border-width: 0;
  --border-color: transparent;
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 6px;
  --padding-bottom: 6px;
  min-height: 32px;
  font-weight: 500;
  letter-spacing: 0;
  border: none;
}

ion-segment-button::part(indicator) {
  display: none;
}

ion-segment-button::part(native) {
  border: none;
}

ion-segment-button ion-label {
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
  white-space: nowrap;
}

@media (prefers-color-scheme: dark) {
  ion-segment-button {
    --background-checked: rgba(255, 255, 255, 0.15);
    --background-hover: rgba(255, 255, 255, 0.08);
  }
}
</style>
