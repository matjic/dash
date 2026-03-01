<template>
  <!-- Add Comment Input -->
  <ion-item lines="none" class="add-comment-container">
    <div class="add-comment-box">
      <textarea
        :value="localText"
        class="comment-textarea"
        placeholder="Add a comment..."
        rows="3"
        @input="$emit('update:localText', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
      <div class="comment-actions">
        <ion-button fill="clear" size="small" @click="$emit('add-comment-with-photo')">
          <ion-icon slot="icon-only" :icon="cameraOutline" />
        </ion-button>
        <ion-button
          fill="solid"
          size="small"
          :disabled="!localText.trim()"
          @click="$emit('add-comment')"
        >
          Add
        </ion-button>
      </div>
    </div>
  </ion-item>

  <template v-if="sortedComments.length > 0">
    <ion-item v-for="comment in sortedComments" :key="comment.id" lines="full" class="comment-item">
      <ion-label class="ion-text-wrap">
        <p class="comment-date">
          {{ formatCommentDate(comment.createdDate) }}
          <span v-if="comment.updatedDate" class="edited-badge">(edited)</span>
        </p>
        <div class="comment-text">
          <RichText :text="comment.text" />
        </div>
        <div
          v-if="comment.imagePath"
          class="comment-image"
          @click="$emit('view-comment-photo', comment.imagePath)"
        >
          <img :src="commentPhotoUris[comment.imagePath]" />
        </div>
      </ion-label>
      <ion-buttons slot="end">
        <ion-button fill="clear" size="small" @click="$emit('edit-comment', comment)">
          <ion-icon slot="icon-only" :icon="createOutline" color="primary" />
        </ion-button>
        <ion-button fill="clear" size="small" @click="$emit('delete-comment', comment)">
          <ion-icon slot="icon-only" :icon="trashOutline" color="danger" />
        </ion-button>
      </ion-buttons>
    </ion-item>
  </template>
  <ion-item v-else lines="none">
    <ion-label color="medium">No comments yet</ion-label>
  </ion-item>
</template>

<script setup lang="ts">
import { IonItem, IonLabel, IonButtons, IonButton, IonIcon } from '@ionic/vue';
import { cameraOutline, createOutline, trashOutline } from 'ionicons/icons';
import { formatCommentDate } from '../utils/date';
import type { Comment } from '../models/DashItem';
import RichText from './RichText.vue';

defineProps<{
  sortedComments: Comment[];
  commentPhotoUris: Record<string, string>;
  localText: string;
}>();

defineEmits<{
  'add-comment': [];
  'add-comment-with-photo': [];
  'edit-comment': [comment: Comment];
  'delete-comment': [comment: Comment];
  'view-comment-photo': [imagePath: string];
  'update:localText': [value: string];
}>();
</script>

<style scoped>
.add-comment-container {
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.add-comment-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--ion-color-light-shade);
  border-radius: 12px;
  background: var(--ion-background-color);
  color: var(--ion-text-color);
  font-family: inherit;
  font-size: 1rem;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
}

.comment-textarea:focus {
  border-color: var(--ion-color-primary);
}

.comment-textarea::placeholder {
  color: var(--ion-color-medium);
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.comment-item {
  --padding-top: 12px;
  --padding-bottom: 12px;
}

.comment-date {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
}

.edited-badge {
  font-style: italic;
  margin-left: 4px;
}

.comment-text {
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.comment-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
