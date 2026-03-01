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
          <ion-button v-else @click="exitEditMode"> Cancel </ion-button>
        </ion-buttons>
        <ion-title>{{ headerTitle }}</ion-title>
        <ion-buttons slot="end">
          <!-- View mode: show Share and Edit buttons -->
          <template v-if="isViewMode && isExistingItem">
            <ion-button @click="showShareOptions">
              <ion-icon slot="icon-only" :icon="shareOutline" />
            </ion-button>
            <ion-button @click="enterEditMode"> Edit </ion-button>
          </template>
          <!-- Edit mode: show Save button -->
          <ion-button v-else :strong="true" :disabled="!canSave" @click="onSave"> Save </ion-button>
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
            </ion-label>
          </ion-item>

          <!-- Task view fields -->
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
            <ion-item v-for="link in item.links" :key="link" button @click="openExternalLink(link)">
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

          <!-- Comments -->
          <ion-item-divider>
            <ion-label>Comments</ion-label>
          </ion-item-divider>

          <CommentSection
            v-model:local-text="newCommentText"
            :sorted-comments="sortedComments"
            :comment-photo-uris="commentPhotoUris"
            @add-comment="handleAddComment"
            @add-comment-with-photo="handleAddCommentWithPhoto"
            @edit-comment="showEditComment"
            @delete-comment="confirmDeleteComment"
            @view-comment-photo="viewCommentPhoto"
          />

          <!-- Timestamps -->
          <div class="timestamps-section">
            <p class="timestamp-text">Created {{ formatRelativeDate(item.createdDate) }}</p>
            <p v-if="item.updatedDate" class="timestamp-text">
              Updated {{ formatRelativeDate(item.updatedDate) }}
            </p>
          </div>
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

          <!-- Due Date -->
          <ion-item button @click="pickDueDate">
            <ion-label>Due Date</ion-label>
            <ion-text slot="end" color="medium">
              {{ item.dueDate ? formatDate(item.dueDate) : 'None' }}
            </ion-text>
          </ion-item>

          <!-- Priority -->
          <ion-item>
            <ion-select v-model="item.priority" label="Priority" interface="action-sheet">
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
            <ion-select v-model="item.recurrenceRule" label="Repeat" interface="action-sheet">
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
              <ion-chip v-for="(tag, index) in item.tags" :key="tag" @click="removeTag(index)">
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

          <!-- Comments -->
          <ion-item-divider>
            <ion-label>Comments</ion-label>
          </ion-item-divider>

          <CommentSection
            v-model:local-text="newCommentText"
            :sorted-comments="sortedComments"
            :comment-photo-uris="commentPhotoUris"
            @add-comment="handleAddComment"
            @add-comment-with-photo="handleAddCommentWithPhoto"
            @edit-comment="showEditComment"
            @delete-comment="confirmDeleteComment"
            @view-comment-photo="viewCommentPhoto"
          />
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
  IonIcon,
  IonText,
  IonChip,
  alertController,
  actionSheetController,
} from '@ionic/vue';
import { DatePicker } from '@capacitor-community/date-picker';
import {
  chevronBackOutline,
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
  shareOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AppLauncher } from '@capacitor/app-launcher';
import { photoService } from '../services/photoService';
import { openLink } from '../services/linkService';
import { shareItemService } from '../services/shareItemService';
import {
  generateGoogleCalendarLink,
  canGenerateCalendarLink,
} from '../services/calendarLinkService';
import type { DashItem, Comment } from '../models/DashItem';
import { formatDate, formatRelativeDate } from '../utils/date';
import { capitalizeFirst } from '../utils/string';
import { useItemDetail } from '../composables/useItemDetail';
import RichText from '../components/RichText.vue';
import PhotoViewer from '../components/PhotoViewer.vue';
import CommentSection from '../components/CommentSection.vue';

const {
  item,
  isExistingItem,
  isViewMode,
  photoUris,
  commentPhotoUris,
  isPhotoViewerOpen,
  photoViewerIndex,
  newCommentText,
  canSave,
  sortedComments,
  headerTitle,
  priorityColor,
  enterEditMode,
  exitEditMode,
  onBack,
  viewPhoto,
  closePhotoViewer,
  removePhoto,
  handleAddComment,
  handleAddCommentWithPhoto,
  updateComment,
  deleteComment,
  viewCommentPhoto,
  onSave,
} = useItemDetail();

function getTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

async function openExternalLink(url: string) {
  await openLink(url);
}

async function showShareOptions() {
  await Haptics.impact({ style: ImpactStyle.Light });

  const buttons: { text: string; role?: string; handler?: () => void }[] = [
    {
      text: 'Share as Text',
      handler: () => {
        shareAsText();
      },
    },
    {
      text: 'Export as PDF',
      handler: () => {
        exportAsPdf();
      },
    },
  ];

  if (canGenerateCalendarLink(item as DashItem)) {
    buttons.push({
      text: 'Add to Google Calendar',
      handler: () => {
        addToGoogleCalendar();
      },
    });
  }

  buttons.push({ text: 'Cancel', role: 'cancel' });

  const actionSheet = await actionSheetController.create({
    header: 'Share',
    buttons,
  });

  await actionSheet.present();
}

async function shareAsText() {
  try {
    await shareItemService.shareAsText(item as DashItem);
  } catch (error) {
    console.log('Share cancelled or error:', error);
  }
}

async function exportAsPdf() {
  try {
    await shareItemService.exportAsPdf(item as DashItem);
  } catch (error) {
    console.log('PDF export cancelled or error:', error);
  }
}

async function addToGoogleCalendar() {
  const url = generateGoogleCalendarLink(item as DashItem);
  if (url) {
    await Haptics.impact({ style: ImpactStyle.Light });
    await AppLauncher.openUrl({ url });
  }
}

async function pickDueDate() {
  try {
    const currentDate = item.dueDate
      ? new Date(item.dueDate).toISOString()
      : new Date().toISOString();
    const result = await DatePicker.present({
      mode: 'dateAndTime',
      format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
      date: currentDate,
      theme: getTheme(),
      ios: { style: 'inline' },
    });
    if (result?.value) {
      item.dueDate = result.value;
    }
  } catch (error) {
    console.log('Date picker cancelled or error:', error);
  }
}

async function pickReminderDate() {
  try {
    const now = new Date();
    const currentDate = item.reminderDate
      ? new Date(item.reminderDate).toISOString()
      : now.toISOString();
    const result = await DatePicker.present({
      mode: 'dateAndTime',
      format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
      date: currentDate,
      min: now.toISOString(),
      theme: getTheme(),
      ios: { style: 'inline' },
    });
    if (result?.value) {
      item.reminderDate = result.value;
    }
  } catch (error) {
    console.log('Date picker cancelled or error:', error);
  }
}

async function showAddTag() {
  const alert = await alertController.create({
    header: 'Add Tag',
    inputs: [{ name: 'tag', type: 'text', placeholder: 'Enter tag name' }],
    buttons: [
      { text: 'Cancel', role: 'cancel' },
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
    inputs: [{ name: 'link', type: 'url', placeholder: 'https://example.com' }],
    buttons: [
      { text: 'Cancel', role: 'cancel' },
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
      { text: 'Cancel', role: 'cancel' },
    ],
  });

  await actionSheet.present();
}

async function showEditComment(comment: Comment) {
  const alert = await alertController.create({
    header: 'Edit Comment',
    inputs: [
      {
        name: 'text',
        type: 'textarea',
        value: comment.text,
        placeholder: 'Enter your comment...',
      },
    ],
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Save',
        handler: (data) => {
          const text = data.text?.trim();
          if (text) {
            updateComment(comment.id, text);
          }
        },
      },
    ],
  });

  await alert.present();
}

async function confirmDeleteComment(comment: Comment) {
  const alert = await alertController.create({
    header: 'Delete Comment',
    message: 'Are you sure you want to delete this comment?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          deleteComment(comment);
        },
      },
    ],
  });

  await alert.present();
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
  margin: 0;
}

.view-notes {
  white-space: pre-wrap;
  word-break: break-word;
}

.link-label {
  text-decoration: underline;
}

/* Timestamps section */
.timestamps-section {
  padding: 16px;
  text-align: center;
}

.timestamp-text {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin: 4px 0;
}
</style>
