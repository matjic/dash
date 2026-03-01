<template>
  <ion-page>
    <ion-content
      :scroll-y="true"
      class="main-content"
      :scroll-events="true"
      @ionScroll="onScroll"
      @ionScrollStart="onScrollStart"
      @click="onContentClick"
    >
      <!-- Header -->
      <div class="app-header">
        <img :src="logoLight" alt="Dash" class="app-logo app-logo-light" />
        <img :src="logoDark" alt="Dash" class="app-logo app-logo-dark" />
        <h1 class="app-title">Dash</h1>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner name="crescent" />
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <ion-icon :icon="clipboardOutline" />
        <h2>No items yet</h2>
        <p>Add a task using the input below</p>
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
        />
      </ion-list>

      <!-- Spacer for floating elements -->
      <div class="bottom-spacer"></div>
    </ion-content>

    <!-- Floating toggle button -->
    <button
      class="floating-completed-toggle"
      :class="{ 'toggle-active': showCompleted, 'toggle-hidden': !isFilterVisible }"
      @click="onToggleShowCompleted"
      :aria-label="showCompleted ? 'Hide completed' : 'Show completed'"
    >
      <ion-icon :icon="showCompleted ? checkmarkCircle : checkmarkCircleOutline" />
    </button>

    <QuickAddBar ref="quickAddRef" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonList, IonIcon, IonSpinner, alertController } from '@ionic/vue';
import { clipboardOutline, checkmarkCircle, checkmarkCircleOutline } from 'ionicons/icons';
import logoLight from '../assets/dash_d_tight_light.svg';
import logoDark from '../assets/dash_d_tight_dark.svg';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import ItemRow from '../components/ItemRow.vue';
import QuickAddBar from '../components/QuickAddBar.vue';
import { useItems } from '../composables/useItems';
import type { DashItem } from '../models/DashItem';

const router = useRouter();
const { filteredItems, isLoading, showCompleted, toggleComplete, toggleShowCompleted, deleteItem } =
  useItems();

const quickAddRef = ref<InstanceType<typeof QuickAddBar> | null>(null);
const isFilterVisible = ref(true);
let lastScrollTop = 0;
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

// Dismiss keyboard when tapping outside the input area
function onContentClick(event: Event) {
  const target = event.target as HTMLElement;
  // Don't dismiss if tapping on the QuickAddBar itself
  if (!target.closest('.quick-add-footer')) {
    quickAddRef.value?.dismissKeyboard();
  }
}

// Dismiss keyboard when scrolling starts
function onScrollStart() {
  quickAddRef.value?.dismissKeyboard();
}

function onScroll(event: CustomEvent) {
  const scrollTop = event.detail.scrollTop;
  const delta = scrollTop - lastScrollTop;

  // Hide filter when scrolling down, show when scrolling up
  if (delta > 5 && scrollTop > 50) {
    isFilterVisible.value = false;
  } else if (delta < -5) {
    isFilterVisible.value = true;
  }

  lastScrollTop = scrollTop;

  // Show filter after scroll stops
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = setTimeout(() => {
    isFilterVisible.value = true;
  }, 1500);
}

onUnmounted(() => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});

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

async function onToggleShowCompleted() {
  await Haptics.impact({ style: ImpactStyle.Light });
  await toggleShowCompleted();
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
  --padding-top: calc(env(safe-area-inset-top) + 16px);
}

.app-header {
  display: flex;
  align-items: center;
  padding: 8px 20px 16px;
  padding-top: calc(env(safe-area-inset-top) + 8px);
  margin-top: calc(-1 * env(safe-area-inset-top) - 16px);
  gap: 10px;
  background-color: var(--ion-background-color);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .app-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.app-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

/* Light mode: show light logo, hide dark logo */
.app-logo-light {
  display: block;
}

.app-logo-dark {
  display: none;
}

@media (prefers-color-scheme: dark) {
  /* Dark mode: show dark logo, hide light logo */
  .app-logo-light {
    display: none;
  }

  .app-logo-dark {
    display: block;
  }
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: var(--ion-text-color);
}

.bottom-spacer {
  height: calc(130px + env(safe-area-inset-bottom));
}

.floating-completed-toggle {
  position: fixed;
  bottom: calc(70px + env(safe-area-inset-bottom));
  right: 16px;
  z-index: 99;

  /* Button sizing */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66px;
  height: 66px;
  border: none;
  border-radius: 50%;
  cursor: pointer;

  /* Transitions */
  transition:
    opacity 0.25s ease,
    transform 0.25s ease,
    background-color 0.2s ease;

  /* Liquid glass effect - Light mode */
  background: rgba(255, 255, 255, 0.7);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.floating-completed-toggle ion-icon {
  font-size: 36px;
  color: var(--ion-color-medium);
}

.floating-completed-toggle:active {
  background: rgba(230, 230, 230, 0.8);
}

.floating-completed-toggle.toggle-active ion-icon {
  color: var(--ion-color-primary);
}

.floating-completed-toggle.toggle-hidden {
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .floating-completed-toggle {
    background: rgba(60, 60, 60, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .floating-completed-toggle:active {
    background: rgba(80, 80, 80, 0.8);
  }
}
</style>
