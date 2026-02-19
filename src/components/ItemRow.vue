<template>
  <ion-item-sliding ref="slidingItem">
    <!-- Main item content -->
    <ion-item
      :class="itemClasses"
      button
      :detail="true"
      @click="onClick"
    >
      <!-- Type icon -->
      <ion-icon
        slot="start"
        :icon="checkmarkCircleOutline"
        :color="iconColor"
      />

      <!-- Priority indicator -->
      <div
        v-if="item.priority !== 'none'"
        class="priority-dot"
        :class="`priority-${item.priority}`"
        slot="start"
      />

      <ion-label>
        <h2>{{ item.title }}</h2>
        <p v-if="displayDate">{{ displayDate }}</p>
        <p v-if="item.location" class="location">
          <ion-icon :icon="locationOutline" />
          {{ item.location }}
        </p>
      </ion-label>

      <!-- Photo indicator -->
      <ion-icon
        v-if="item.photoPaths.length > 0"
        slot="end"
        :icon="imageOutline"
        color="medium"
      />

      <!-- Tags -->
      <ion-badge
        v-for="tag in displayTags"
        :key="tag"
        slot="end"
        color="light"
      >
        {{ tag }}
      </ion-badge>
    </ion-item>

    <!-- Right swipe options -->
    <ion-item-options side="end">
      <ion-item-option
        :color="item.isCompleted ? 'warning' : 'success'"
        @click="onToggleComplete"
      >
        <ion-icon
          slot="icon-only"
          :icon="item.isCompleted ? closeCircleOutline : checkmarkCircle"
        />
      </ion-item-option>
      <ion-item-option color="danger" @click="onDelete">
        <ion-icon slot="icon-only" :icon="trashOutline" />
      </ion-item-option>
    </ion-item-options>
  </ion-item-sliding>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonIcon,
  IonBadge,
} from '@ionic/vue';
import {
  checkmarkCircleOutline,
  checkmarkCircle,
  trashOutline,
  closeCircleOutline,
  locationOutline,
  imageOutline,
} from 'ionicons/icons';
import type { DashItem } from '../models/DashItem';
import { isOverdue, getRelevantDate } from '../models/DashItem';

const props = defineProps<{
  item: DashItem;
}>();

const emit = defineEmits<{
  click: [item: DashItem];
  toggleComplete: [id: string];
  delete: [id: string];
}>();

const slidingItem = ref<InstanceType<typeof IonItemSliding> | null>(null);

const iconColor = computed(() => {
  if (props.item.isCompleted) {
    return 'success';
  }
  if (isOverdue(props.item)) {
    return 'danger';
  }
  return 'primary';
});

const itemClasses = computed(() => {
  const classes: string[] = [];
  if (props.item.isCompleted) {
    classes.push('item-completed');
  }
  if (isOverdue(props.item)) {
    classes.push('item-overdue');
  }
  return classes;
});

const displayDate = computed(() => {
  const date = getRelevantDate(props.item);
  if (!date) return null;

  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  if (isToday) {
    return `Today at ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
});

const displayTags = computed(() => {
  // Show first 2 tags
  return props.item.tags.slice(0, 2);
});

function closeSliding() {
  slidingItem.value?.$el.close();
}

function onClick() {
  emit('click', props.item);
}

function onToggleComplete() {
  closeSliding();
  emit('toggleComplete', props.item.id);
}

function onDelete() {
  closeSliding();
  emit('delete', props.item.id);
}
</script>

<style scoped>
.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.priority-dot.priority-low {
  background-color: var(--ion-color-success);
}

.priority-dot.priority-medium {
  background-color: var(--ion-color-warning);
}

.priority-dot.priority-high {
  background-color: var(--ion-color-danger);
}

.location {
  display: flex;
  align-items: center;
  gap: 4px;
}

.location ion-icon {
  font-size: 12px;
}

ion-badge {
  margin-left: 4px;
  font-size: 10px;
}

/* Ensure consistent row height */
ion-item {
  --min-height: 60px;
}

ion-label {
  margin: 12px 0;
}

/* Fix for iOS highlight appearing on wrong row when inside ion-item-sliding */
ion-item {
  --background-activated: transparent;
  --background-focused: transparent;
  --background-hover: transparent;
  --ripple-color: transparent;
}

ion-item.ion-activated {
  --background: rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  ion-item.ion-activated {
    --background: rgba(255, 255, 255, 0.1);
  }
}
</style>
