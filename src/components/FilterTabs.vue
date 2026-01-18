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
