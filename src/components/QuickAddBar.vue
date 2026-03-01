<template>
  <div class="quick-add-footer" :style="{ transform: `translateY(-${keyboardHeight}px)` }">
    <div class="input-container">
      <ion-icon :icon="searchOutline" class="search-icon" />
      <input
        ref="inputRef"
        v-model="inputText"
        type="text"
        placeholder="Search or add..."
        @keyup.enter="onAdd"
        @input="onInputChange"
      />
      <ion-icon v-if="inputText" :icon="closeCircle" class="clear-icon" @click="clearInput" />
      <button class="add-button" :disabled="!canAdd" @click="onAdd">
        <ion-icon :icon="addCircle" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { IonIcon } from '@ionic/vue';
import { addCircle, searchOutline, closeCircle } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { parseQuickInput } from '../services/nlpParser';
import { useItems } from '../composables/useItems';

const { createItem, setSearchText, searchText } = useItems();

const inputRef = ref<HTMLInputElement | null>(null);
const inputText = ref(searchText.value);
const keyboardHeight = ref(0);

const canAdd = computed(() => inputText.value.trim().length > 0);

// Listen for keyboard events
onMounted(async () => {
  inputText.value = searchText.value;

  await Keyboard.addListener('keyboardWillShow', (info) => {
    keyboardHeight.value = info.keyboardHeight;
  });

  await Keyboard.addListener('keyboardWillHide', () => {
    keyboardHeight.value = 0;
  });
});

onUnmounted(() => {
  Keyboard.removeAllListeners();
});

watch(searchText, (newValue) => {
  if (newValue !== inputText.value) {
    inputText.value = newValue;
  }
});

function onInputChange(event: Event) {
  const value = (event.target as HTMLInputElement).value || '';
  setSearchText(value);
}

function clearInput() {
  inputText.value = '';
  setSearchText('');
}

async function dismissKeyboard() {
  inputRef.value?.blur();
  await Keyboard.hide();
}

// Expose dismissKeyboard for parent components
defineExpose({ dismissKeyboard });

async function onAdd() {
  if (!canAdd.value) return;

  const parsed = parseQuickInput(inputText.value);

  try {
    await createItem({
      title: parsed.title || inputText.value.trim(),
      priority: parsed.priority,
      isRecurring: parsed.isRecurring,
      recurrenceRule: parsed.recurrenceRule,
      dueDate: parsed.dueDate?.toISOString(),
      isCompleted: false,
      hasReminder: false,
      tags: [],
      links: [],
      photoPaths: [],
      comments: [],
      attachments: [],
    });

    // Clear both local and global search
    inputText.value = '';
    setSearchText('');

    // Haptic feedback is best-effort; never block task creation
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  } catch (error) {
    console.error('Error creating item:', error);
  }
}
</script>

<style scoped>
.quick-add-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  transition: transform 0.25s ease-out;
  margin: 8px 16px;
  margin-bottom: calc(8px + env(safe-area-inset-bottom));
  z-index: 100;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 27px;
  padding: 12px 16px;
  height: 54px;
  box-sizing: border-box;

  /* Liquid glass effect - Light mode */
  background: rgba(255, 255, 255, 0.7);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .input-container {
    background: rgba(60, 60, 60, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
}

.search-icon {
  color: rgba(60, 60, 67, 0.6);
  font-size: 22px;
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .search-icon {
    color: rgba(235, 235, 245, 0.6);
  }
}

input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--ion-text-color, #000);
  outline: none;
  min-width: 0;
}

input::placeholder {
  color: rgba(60, 60, 67, 0.6);
}

@media (prefers-color-scheme: dark) {
  input {
    color: #fff;
  }
  input::placeholder {
    color: rgba(235, 235, 245, 0.6);
  }
}

.clear-icon {
  color: rgba(60, 60, 67, 0.6);
  font-size: 22px;
  flex-shrink: 0;
  cursor: pointer;
}

@media (prefers-color-scheme: dark) {
  .clear-icon {
    color: rgba(235, 235, 245, 0.6);
  }
}

.add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.add-button ion-icon {
  font-size: 30px;
  color: var(--ion-color-primary, #007aff);
}

.add-button:disabled ion-icon {
  color: rgba(60, 60, 67, 0.3);
}

@media (prefers-color-scheme: dark) {
  .add-button:disabled ion-icon {
    color: rgba(235, 235, 245, 0.3);
  }
}
</style>
