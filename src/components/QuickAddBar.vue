<template>
  <ion-footer>
    <ion-toolbar>
      <ion-input
        v-model="inputText"
        placeholder="Add task... (e.g., 'Meeting tomorrow at 2pm high priority')"
        :clear-input="true"
        @keyup.enter="onAdd"
      />
      <ion-button
        slot="end"
        fill="clear"
        :disabled="!canAdd"
        @click="onAdd"
      >
        <ion-icon slot="icon-only" :icon="addCircle" />
      </ion-button>
    </ion-toolbar>
  </ion-footer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonFooter, IonToolbar, IonInput, IonButton, IonIcon } from '@ionic/vue';
import { addCircle } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { parseQuickInput } from '../services/nlpParser';
import { useItems } from '../composables/useItems';

const { createItem } = useItems();

const inputText = ref('');

const canAdd = computed(() => inputText.value.trim().length > 0);

async function onAdd() {
  if (!canAdd.value) return;

  const parsed = parseQuickInput(inputText.value);

  try {
    // Haptic feedback
    await Haptics.impact({ style: ImpactStyle.Light });

    await createItem({
      title: parsed.title,
      itemType: 'task',
      priority: parsed.priority,
      isRecurring: parsed.isRecurring,
      recurrenceRule: parsed.recurrenceRule,
      dueDate: parsed.dueDate?.toISOString(),
      isCompleted: false,
      hasReminder: false,
      tags: [],
      links: [],
      photoPaths: [],
    });

    inputText.value = '';
  } catch (error) {
    console.error('Error creating item:', error);
  }
}
</script>

<style scoped>
ion-toolbar {
  --padding-start: 8px;
  --padding-end: 8px;
}

ion-input {
  --padding-start: 8px;
}

ion-button {
  --padding-start: 8px;
  --padding-end: 8px;
}
</style>
