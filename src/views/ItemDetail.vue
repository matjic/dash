<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <!-- View mode or new item: show back arrow -->
          <ion-button v-if="isViewMode || !isExistingItem" @click="onBack">
            <ion-icon slot="icon-only" :icon="chevronBackOutline" />
          </ion-button>
          <!-- Edit mode for existing item: show Cancel -->
          <ion-button v-else @click="exitEditMode">
            Cancel
          </ion-button>
        </ion-buttons>
        <ion-title>{{ headerTitle }}</ion-title>
        <ion-buttons slot="end">
          <!-- View mode: show Edit button -->
          <ion-button v-if="isViewMode && isExistingItem" @click="enterEditMode">
            Edit
          </ion-button>
          <!-- Edit mode: show Save button -->
          <ion-button v-else :strong="true" :disabled="!canSave" @click="onSave">
            Save
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- VIEW MODE -->
      <template v-if="isViewMode && isExistingItem">
        <ion-list>
          <!-- Title -->
          <ion-item lines="none">
            <ion-label class="view-title">
              <h1>{{ item.title }}</h1>
              <p v-if="item.itemType === 'task'" class="item-type-badge task-badge">Task</p>
              <p v-else class="item-type-badge event-badge">Event</p>
            </ion-label>
          </ion-item>

          <!-- Task-specific view fields -->
          <template v-if="item.itemType === 'task'">
            <ion-item v-if="item.dueDate">
              <ion-icon :icon="calendarOutline" slot="start" color="primary" />
              <ion-label>
                <p>Due Date</p>
                <h2>{{ formatDate(item.dueDate) }}</h2>
              </ion-label>
            </ion-item>

            <ion-item v-if="item.priority && item.priority !== 'none'">
              <ion-icon :icon="flagOutline" slot="start" :color="priorityColor" />
              <ion-label>
                <p>Priority</p>
                <h2>{{ capitalizeFirst(item.priority) }}</h2>
              </ion-label>
            </ion-item>

            <ion-item v-if="item.isRecurring">
              <ion-icon :icon="repeatOutline" slot="start" color="tertiary" />
              <ion-label>
                <p>Repeats</p>
                <h2>{{ capitalizeFirst(item.recurrenceRule || 'daily') }}</h2>
              </ion-label>
            </ion-item>

            <ion-item v-if="item.hasReminder && item.reminderDate">
              <ion-icon :icon="notificationsOutline" slot="start" color="warning" />
              <ion-label>
                <p>Reminder</p>
                <h2>{{ formatDate(item.reminderDate) }}</h2>
              </ion-label>
            </ion-item>
          </template>

          <!-- Event-specific view fields -->
          <template v-if="item.itemType === 'event'">
            <ion-item v-if="item.eventDate">
              <ion-icon :icon="calendarOutline" slot="start" color="primary" />
              <ion-label>
                <p>Start Date</p>
                <h2>{{ formatDate(item.eventDate) }}</h2>
              </ion-label>
            </ion-item>

            <ion-item v-if="item.endDate">
              <ion-icon :icon="calendarOutline" slot="start" color="medium" />
              <ion-label>
                <p>End Date</p>
                <h2>{{ formatDate(item.endDate) }}</h2>
              </ion-label>
            </ion-item>
          </template>

          <!-- Location -->
          <ion-item v-if="item.location">
            <ion-icon :icon="locationOutline" slot="start" color="danger" />
            <ion-label>
              <p>Location</p>
              <h2>{{ item.location }}</h2>
            </ion-label>
          </ion-item>

          <!-- Notes with clickable links -->
          <template v-if="item.notes">
            <ion-item-divider>
              <ion-label>Notes</ion-label>
            </ion-item-divider>
            <ion-item lines="none">
              <ion-label class="view-notes">
                <RichText :text="item.notes" />
              </ion-label>
            </ion-item>
          </template>

          <!-- Tags -->
          <template v-if="item.tags.length > 0">
            <ion-item-divider>
              <ion-label>Tags</ion-label>
            </ion-item-divider>
            <ion-item lines="none">
              <div class="tags-container">
                <ion-chip v-for="tag in item.tags" :key="tag" color="primary" outline>
                  {{ tag }}
                </ion-chip>
              </div>
            </ion-item>
          </template>

          <!-- Links -->
          <template v-if="item.links.length > 0">
            <ion-item-divider>
              <ion-label>Links</ion-label>
            </ion-item-divider>
            <ion-item
              v-for="link in item.links"
              :key="link"
              button
              @click="openExternalLink(link)"
            >
              <ion-icon :icon="linkOutline" slot="start" color="primary" />
              <ion-label color="primary" class="link-label">{{ link }}</ion-label>
              <ion-icon :icon="openOutline" slot="end" color="medium" />
            </ion-item>
          </template>

          <!-- Photos -->
          <template v-if="item.photoPaths.length > 0">
            <ion-item-divider>
              <ion-label>Photos</ion-label>
            </ion-item-divider>
            <ion-item lines="none">
              <div class="photos-grid">
                <div
                  v-for="(photoPath, index) in item.photoPaths"
                  :key="photoPath"
                  class="photo-item"
                  @click="viewPhoto(index)"
                >
                  <img :src="photoUris[photoPath]" />
                </div>
              </div>
            </ion-item>
          </template>
        </ion-list>
      </template>

      <!-- EDIT MODE (or creating new item) -->
      <template v-else>
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
      </template>
    </ion-content>

    <!-- Photo Viewer Modal -->
    <PhotoViewer
      :photos="item.photoPaths"
      :initial-index="photoViewerIndex"
      :is-open="isPhotoViewerOpen"
      @close="closePhotoViewer"
    />
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
  chevronBackOutline,
  checkmarkCircleOutline,
  calendarOutline,
  addOutline,
  closeCircle,
  linkOutline,
  trashOutline,
  cameraOutline,
  flagOutline,
  repeatOutline,
  notificationsOutline,
  locationOutline,
  openOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useItems } from '../composables/useItems';
import { photoService } from '../services/photoService';
import { openLink } from '../services/linkService';
import type { DashItem } from '../models/DashItem';
import { createEmptyItem } from '../models/DashItem';
import RichText from '../components/RichText.vue';
import PhotoViewer from '../components/PhotoViewer.vue';

const route = useRoute();
const ionRouter = useIonRouter();
const { items, createItem, updateItem } = useItems();

// Track the original item ID separately to handle editing state correctly
const originalItemId = ref<string | undefined>(undefined);
const isExistingItem = computed(() => !!originalItemId.value);

// View mode state: existing items start in view mode, new items start in edit mode
const isViewMode = ref(true);

const item = reactive<DashItem>(createEmptyItem());
const originalItemSnapshot = ref<DashItem | null>(null);
const photoUris = ref<Record<string, string>>({});

// Photo viewer state
const isPhotoViewerOpen = ref(false);
const photoViewerIndex = ref(0);

const canSave = computed(() => item.title.trim().length > 0);

const headerTitle = computed(() => {
  if (isViewMode.value && isExistingItem.value) {
    return item.itemType === 'task' ? 'Task' : 'Event';
  }
  const action = isExistingItem.value ? 'Edit' : 'New';
  const type = item.itemType === 'task' ? 'Task' : 'Event';
  return `${action} ${type}`;
});

const priorityColor = computed(() => {
  switch (item.priority) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'medium';
  }
});

onMounted(async () => {
  const paramId = route.params.id as string | undefined;
  if (paramId) {
    originalItemId.value = paramId;
    const existingItem = items.value.find((i) => i.id === paramId);
    if (existingItem) {
      Object.assign(item, existingItem);
      originalItemSnapshot.value = JSON.parse(JSON.stringify(existingItem));
      isViewMode.value = true; // Existing items start in view mode
      await loadPhotoUris();
    } else {
      // Item not found, go back
      ionRouter.back();
    }
  } else {
    // New item - start in edit mode
    isViewMode.value = false;
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

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

function enterEditMode() {
  // Save snapshot before editing
  originalItemSnapshot.value = JSON.parse(JSON.stringify(item));
  isViewMode.value = false;
}

function exitEditMode() {
  // Restore original values
  if (originalItemSnapshot.value) {
    Object.assign(item, originalItemSnapshot.value);
  }
  isViewMode.value = true;
}

function onBack() {
  ionRouter.back();
}

async function openExternalLink(url: string) {
  await openLink(url);
}

// Photo viewer functions
function viewPhoto(index: number) {
  photoViewerIndex.value = index;
  isPhotoViewerOpen.value = true;
}

function closePhotoViewer() {
  isPhotoViewerOpen.value = false;
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

async function removePhoto(index: number) {
  const path = item.photoPaths[index];
  if (!path) return;

  // Only delete from filesystem if editing an existing item
  // For new items, the photo will be saved when the item is saved
  if (isExistingItem.value) {
    await photoService.deletePhoto(path);
  }

  item.photoPaths.splice(index, 1);
  delete photoUris.value[path];
}

async function onSave() {
  if (!canSave.value) return;

  await Haptics.impact({ style: ImpactStyle.Light });

  try {
    if (isExistingItem.value && originalItemId.value) {
      // Ensure we're updating with the original ID
      await updateItem({ ...item, id: originalItemId.value } as DashItem);
      // After save, go back to view mode
      originalItemSnapshot.value = JSON.parse(JSON.stringify(item));
      isViewMode.value = true;
    } else {
      await createItem(item as Omit<DashItem, 'id' | 'createdDate'>);
      ionRouter.back();
    }
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
  cursor: pointer;
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

/* View mode styles */
.view-title h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.item-type-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0;
}

.task-badge {
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
}

.event-badge {
  background: var(--ion-color-tertiary);
  color: var(--ion-color-tertiary-contrast);
}

.view-notes {
  white-space: pre-wrap;
  word-break: break-word;
}

.link-label {
  text-decoration: underline;
}
</style>
