<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="onCancel">Cancel</ion-button>
        </ion-buttons>
        <ion-title>{{ isEditing ? 'Edit' : 'New' }} {{ item.itemType === 'task' ? 'Task' : 'Event' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :strong="true" :disabled="!canSave" @click="onSave">
            Save
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-list>
        <!-- Title -->
        <ion-item>
          <ion-input
            v-model="item.title"
            label="Title"
            label-placement="stacked"
            placeholder="Enter title"
            :clear-input="true"
          />
        </ion-item>

        <!-- Item Type -->
        <ion-item>
          <ion-label>Type</ion-label>
          <ion-segment v-model="item.itemType" @ionChange="onTypeChange">
            <ion-segment-button value="task">
              <ion-icon :icon="checkmarkCircleOutline" />
              <ion-label>Task</ion-label>
            </ion-segment-button>
            <ion-segment-button value="event">
              <ion-icon :icon="calendarOutline" />
              <ion-label>Event</ion-label>
            </ion-segment-button>
          </ion-segment>
        </ion-item>

        <!-- Task-specific fields -->
        <template v-if="item.itemType === 'task'">
          <!-- Due Date -->
          <ion-item button @click="pickDueDate">
            <ion-label>Due Date</ion-label>
            <ion-text slot="end" color="medium">
              {{ item.dueDate ? formatDate(item.dueDate) : 'None' }}
            </ion-text>
          </ion-item>

          <!-- Priority -->
          <ion-item>
            <ion-select
              v-model="item.priority"
              label="Priority"
              interface="action-sheet"
            >
              <ion-select-option value="none">None</ion-select-option>
              <ion-select-option value="low">Low</ion-select-option>
              <ion-select-option value="medium">Medium</ion-select-option>
              <ion-select-option value="high">High</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Recurrence -->
          <ion-item>
            <ion-toggle v-model="item.isRecurring">Recurring</ion-toggle>
          </ion-item>

          <ion-item v-if="item.isRecurring">
            <ion-select
              v-model="item.recurrenceRule"
              label="Repeat"
              interface="action-sheet"
            >
              <ion-select-option value="daily">Daily</ion-select-option>
              <ion-select-option value="weekly">Weekly</ion-select-option>
              <ion-select-option value="monthly">Monthly</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Reminder -->
          <ion-item>
            <ion-toggle v-model="item.hasReminder">Reminder</ion-toggle>
          </ion-item>

          <ion-item v-if="item.hasReminder" button @click="pickReminderDate">
            <ion-label>Reminder Time</ion-label>
            <ion-text slot="end" color="medium">
              {{ item.reminderDate ? formatDate(item.reminderDate) : 'Select time' }}
            </ion-text>
          </ion-item>
        </template>

        <!-- Event-specific fields -->
        <template v-if="item.itemType === 'event'">
          <!-- Event Date -->
          <ion-item button @click="pickEventDate">
            <ion-label>Start Date</ion-label>
            <ion-text slot="end" color="medium">
              {{ item.eventDate ? formatDate(item.eventDate) : 'Select date' }}
            </ion-text>
          </ion-item>

          <!-- End Date -->
          <ion-item button @click="pickEndDate">
            <ion-label>End Date</ion-label>
            <ion-text slot="end" color="medium">
              {{ item.endDate ? formatDate(item.endDate) : 'None' }}
            </ion-text>
          </ion-item>
        </template>

        <!-- Common fields -->
        <ion-item-divider>
          <ion-label>Details</ion-label>
        </ion-item-divider>

        <!-- Notes -->
        <ion-item>
          <ion-textarea
            v-model="item.notes"
            label="Notes"
            label-placement="stacked"
            placeholder="Add notes..."
            :auto-grow="true"
            :rows="3"
          />
        </ion-item>

        <!-- Location -->
        <ion-item>
          <ion-input
            v-model="item.location"
            label="Location"
            label-placement="stacked"
            placeholder="Add location"
            :clear-input="true"
          />
        </ion-item>

        <!-- Tags -->
        <ion-item-divider>
          <ion-label>Tags</ion-label>
          <ion-button slot="end" fill="clear" size="small" @click="showAddTag">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
        </ion-item-divider>

        <ion-item v-if="item.tags.length > 0">
          <div class="tags-container">
            <ion-chip
              v-for="(tag, index) in item.tags"
              :key="tag"
              @click="removeTag(index)"
            >
              {{ tag }}
              <ion-icon :icon="closeCircle" />
            </ion-chip>
          </div>
        </ion-item>
        <ion-item v-else>
          <ion-label color="medium">No tags</ion-label>
        </ion-item>

        <!-- Links -->
        <ion-item-divider>
          <ion-label>Links</ion-label>
          <ion-button slot="end" fill="clear" size="small" @click="showAddLink">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
        </ion-item-divider>

        <template v-if="item.links.length > 0">
          <ion-item v-for="(link, index) in item.links" :key="link">
            <ion-icon :icon="linkOutline" slot="start" />
            <ion-label>{{ link }}</ion-label>
            <ion-button slot="end" fill="clear" color="danger" @click="removeLink(index)">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-button>
          </ion-item>
        </template>
        <ion-item v-else>
          <ion-label color="medium">No links</ion-label>
        </ion-item>

        <!-- Photos -->
        <ion-item-divider>
          <ion-label>Photos</ion-label>
          <ion-button slot="end" fill="clear" size="small" @click="showPhotoOptions">
            <ion-icon slot="icon-only" :icon="cameraOutline" />
          </ion-button>
        </ion-item-divider>

        <ion-item v-if="item.photoPaths.length > 0">
          <div class="photos-grid">
            <div
              v-for="(photoPath, index) in item.photoPaths"
              :key="photoPath"
              class="photo-item"
            >
              <img :src="photoUris[photoPath]" @click="viewPhoto(index)" />
              <ion-button
                fill="clear"
                color="danger"
                size="small"
                class="photo-remove"
                @click="removePhoto(index)"
              >
                <ion-icon slot="icon-only" :icon="closeCircle" />
              </ion-button>
            </div>
          </div>
        </ion-item>
        <ion-item v-else>
          <ion-label color="medium">No photos</ion-label>
        </ion-item>
      </ion-list>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useIonRouter } from '@ionic/vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonText,
  IonChip,
  alertController,
  actionSheetController,
} from '@ionic/vue';
import { DatePicker } from '@capacitor-community/date-picker';
import {
  checkmarkCircleOutline,
  calendarOutline,
  addOutline,
  closeCircle,
  linkOutline,
  trashOutline,
  cameraOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useItems } from '../composables/useItems';
import { photoService } from '../services/photoService';
import type { DashItem } from '../models/DashItem';
import { createEmptyItem } from '../models/DashItem';

const route = useRoute();
const ionRouter = useIonRouter();
const { items, createItem, updateItem } = useItems();

// Track the original item ID separately to handle editing state correctly
const originalItemId = ref<string | undefined>(undefined);
const isEditing = computed(() => !!originalItemId.value);

const item = reactive<DashItem>(createEmptyItem());
const photoUris = ref<Record<string, string>>({});

const canSave = computed(() => item.title.trim().length > 0);

onMounted(async () => {
  const paramId = route.params.id as string | undefined;
  if (paramId) {
    originalItemId.value = paramId;
    const existingItem = items.value.find((i) => i.id === paramId);
    if (existingItem) {
      Object.assign(item, existingItem);
      await loadPhotoUris();
    } else {
      // Item not found, go back
      ionRouter.back();
    }
  }
});

watch(() => item.photoPaths, loadPhotoUris, { deep: true });

async function loadPhotoUris() {
  for (const path of item.photoPaths) {
    if (!photoUris.value[path]) {
      photoUris.value[path] = await photoService.getPhotoUri(path);
    }
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

async function pickDueDate() {
  try {
    const result = await DatePicker.present({
      mode: 'dateAndTime',
      date: item.dueDate ? new Date(item.dueDate).toISOString() : undefined,
      theme: getTheme(),
      ios: {
        style: 'wheels',
      },
    });
    if (result.value) {
      item.dueDate = result.value;
    }
  } catch {
    // User cancelled
  }
}

async function pickReminderDate() {
  try {
    const result = await DatePicker.present({
      mode: 'dateAndTime',
      date: item.reminderDate ? new Date(item.reminderDate).toISOString() : undefined,
      min: new Date().toISOString(),
      theme: getTheme(),
      ios: {
        style: 'wheels',
      },
    });
    if (result.value) {
      item.reminderDate = result.value;
    }
  } catch {
    // User cancelled
  }
}

async function pickEventDate() {
  try {
    const result = await DatePicker.present({
      mode: 'dateAndTime',
      date: item.eventDate ? new Date(item.eventDate).toISOString() : undefined,
      theme: getTheme(),
      ios: {
        style: 'wheels',
      },
    });
    if (result.value) {
      item.eventDate = result.value;
    }
  } catch {
    // User cancelled
  }
}

async function pickEndDate() {
  try {
    const result = await DatePicker.present({
      mode: 'dateAndTime',
      date: item.endDate ? new Date(item.endDate).toISOString() : undefined,
      min: item.eventDate || undefined,
      theme: getTheme(),
      ios: {
        style: 'wheels',
      },
    });
    if (result.value) {
      item.endDate = result.value;
    }
  } catch {
    // User cancelled
  }
}

function onTypeChange() {
  // When switching type, transfer the date
  if (item.itemType === 'event' && item.dueDate && !item.eventDate) {
    item.eventDate = item.dueDate;
    item.dueDate = undefined;
  } else if (item.itemType === 'task' && item.eventDate && !item.dueDate) {
    item.dueDate = item.eventDate;
    item.eventDate = undefined;
    item.endDate = undefined;
  }
}

async function showAddTag() {
  const alert = await alertController.create({
    header: 'Add Tag',
    inputs: [
      {
        name: 'tag',
        type: 'text',
        placeholder: 'Enter tag name',
      },
    ],
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Add',
        handler: (data) => {
          const tag = data.tag?.trim();
          if (tag && !item.tags.includes(tag.toLowerCase())) {
            item.tags.push(tag.toLowerCase());
          }
        },
      },
    ],
  });

  await alert.present();
}

function removeTag(index: number) {
  item.tags.splice(index, 1);
}

async function showAddLink() {
  const alert = await alertController.create({
    header: 'Add Link',
    inputs: [
      {
        name: 'link',
        type: 'url',
        placeholder: 'https://example.com',
      },
    ],
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Add',
        handler: (data) => {
          const link = data.link?.trim();
          if (link && !item.links.includes(link)) {
            item.links.push(link);
          }
        },
      },
    ],
  });

  await alert.present();
}

function removeLink(index: number) {
  item.links.splice(index, 1);
}

async function showPhotoOptions() {
  const actionSheet = await actionSheetController.create({
    header: 'Add Photo',
    buttons: [
      {
        text: 'Take Photo',
        handler: async () => {
          const path = await photoService.capturePhoto();
          if (path) {
            item.photoPaths.push(path);
          }
        },
      },
      {
        text: 'Choose from Library',
        handler: async () => {
          const path = await photoService.pickPhoto();
          if (path) {
            item.photoPaths.push(path);
          }
        },
      },
      {
        text: 'Cancel',
        role: 'cancel',
      },
    ],
  });

  await actionSheet.present();
}

function viewPhoto(index: number) {
  // Could open a full-screen viewer here
  console.log('View photo:', item.photoPaths[index]);
}

async function removePhoto(index: number) {
  const path = item.photoPaths[index];
  if (!path) return;
  
  // Only delete from filesystem if editing an existing item
  // For new items, the photo will be saved when the item is saved
  if (isEditing.value) {
    await photoService.deletePhoto(path);
  }
  
  item.photoPaths.splice(index, 1);
  delete photoUris.value[path];
}

function onCancel() {
  ionRouter.back();
}

async function onSave() {
  if (!canSave.value) return;

  await Haptics.impact({ style: ImpactStyle.Light });

  try {
    if (isEditing.value && originalItemId.value) {
      // Ensure we're updating with the original ID
      await updateItem({ ...item, id: originalItemId.value } as DashItem);
    } else {
      await createItem(item as Omit<DashItem, 'id' | 'createdDate'>);
    }

    ionRouter.back();
  } catch (error) {
    console.error('Error saving item:', error);
    
    const alert = await alertController.create({
      header: 'Error',
      message: 'Failed to save item. Please try again.',
      buttons: ['OK'],
    });

    await alert.present();
  }
}
</script>

<style scoped>
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

ion-chip {
  margin: 0;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px 0;
  width: 100%;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove {
  position: absolute;
  top: 0;
  right: 0;
  --padding-start: 4px;
  --padding-end: 4px;
}
</style>
