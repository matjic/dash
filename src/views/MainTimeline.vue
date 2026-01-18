<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Dash</ion-title>
        <ion-button slot="end" fill="clear" @click="goToNewItem">
          <ion-icon slot="icon-only" :icon="addOutline" />
        </ion-button>
      </ion-toolbar>
      <ion-toolbar>
        <FilterTabs v-model="localFilter" />
      </ion-toolbar>
    </ion-header>

    <ion-content :scroll-y="true" class="main-content">
      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner name="crescent" />
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <ion-icon :icon="clipboardOutline" />
        <h2>No items yet</h2>
        <p>Add a task using the input below or tap the + button</p>
      </div>

      <!-- Items list -->
      <ion-list v-else>
        <ItemRow
          v-for="item in filteredItems"
          :key="item.id"
          :item="item"
          @click="goToItem"
          @toggle-complete="onToggleComplete"
          @delete="onDelete"
          @convert-to-event="onConvertToEvent"
          @convert-to-task="onConvertToTask"
        />
      </ion-list>
      
      <!-- Spacer for fixed search bar -->
      <div class="search-bar-spacer"></div>
    </ion-content>
    
    <QuickAddBar />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonButton,
  IonIcon,
  IonSpinner,
  alertController,
} from '@ionic/vue';
import { addOutline, clipboardOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import FilterTabs from '../components/FilterTabs.vue';
import ItemRow from '../components/ItemRow.vue';
import QuickAddBar from '../components/QuickAddBar.vue';
import { useItems, type FilterType } from '../composables/useItems';
import type { DashItem } from '../models/DashItem';

const router = useRouter();
const {
  filteredItems,
  isLoading,
  selectedFilter,
  setFilter,
  toggleComplete,
  deleteItem,
  convertToEvent,
  convertToTask,
} = useItems();

const localFilter = ref<FilterType>(selectedFilter.value);

// Sync local state with global state
watch(localFilter, (value) => {
  setFilter(value);
});

function goToNewItem() {
  router.push('/item');
}

function goToItem(item: DashItem) {
  router.push(`/item/${item.id}`);
}

async function onToggleComplete(id: string) {
  await Haptics.impact({ style: ImpactStyle.Medium });
  await toggleComplete(id);
}

async function onDelete(id: string) {
  const alert = await alertController.create({
    header: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          await Haptics.notification({ type: NotificationType.Warning });
          await deleteItem(id);
        },
      },
    ],
  });

  await alert.present();
}

async function onConvertToEvent(id: string) {
  await Haptics.impact({ style: ImpactStyle.Light });
  await convertToEvent(id);
}

async function onConvertToTask(id: string) {
  await Haptics.impact({ style: ImpactStyle.Light });
  await convertToTask(id);
}
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 50vh;
  padding: 20px;
  text-align: center;
  color: var(--ion-color-medium);
  position: relative;
  z-index: 1;
}

.empty-state ion-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--ion-text-color);
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.main-content {
  position: relative;
  z-index: 1;
}

.search-bar-spacer {
  height: calc(70px + env(safe-area-inset-bottom));
}
</style>
