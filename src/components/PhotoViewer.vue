<template>
  <ion-modal
    :is-open="isOpen"
    :css-class="'photo-viewer-modal'"
    @didDismiss="onClose"
  >
    <ion-page>
      <ion-header class="ion-no-border" :class="{ 'header-hidden': isHeaderHidden }">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="onClose">
              <ion-icon slot="icon-only" :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
          <ion-title>{{ (currentIndex ?? 0) + 1 }} of {{ photos.length }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content
        :fullscreen="true"
        class="photo-viewer-content"
        :scroll-y="false"
        @click="toggleHeader"
      >
        <div
          ref="containerRef"
          class="swiper-container"
          :style="{ transform: `translateY(${dragOffset}px)`, opacity: dragOpacity }"
        >
          <swiper
            :initial-slide="initialIndex"
            :space-between="20"
            @slideChange="onSlideChange"
            @swiper="onSwiperInit"
          >
            <swiper-slide v-for="(photo, index) in photos" :key="index">
              <div class="photo-scroll-container">
                <img :src="photoUris[photo] || ''" class="photo-image" />
              </div>
            </swiper-slide>
          </swiper>
        </div>
      </ion-content>

      <ion-footer class="ion-no-border" :class="{ 'footer-hidden': isHeaderHidden }">
        <ion-toolbar>
          <ion-buttons slot="end">
            <ion-button @click="onShare">
              <ion-icon slot="icon-only" :icon="shareOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-footer>
    </ion-page>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import {
  IonModal,
  IonPage,
  IonHeader,
  IonFooter,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  createGesture,
  type GestureDetail,
} from '@ionic/vue';
import { closeOutline, shareOutline } from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { photoService } from '../services/photoService';

const props = defineProps<{
  photos: string[];
  initialIndex: number;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const containerRef = ref<HTMLElement | null>(null);
const swiperInstance = ref<SwiperType | null>(null);
const currentIndex = ref(0);
const photoUris = ref<Record<string, string>>({});
const isHeaderHidden = ref(false);
const dragOffset = ref(0);
const dragOpacity = computed(() => {
  const maxDrag = 200;
  return 1 - Math.min(Math.abs(dragOffset.value) / maxDrag, 0.5);
});

let gesture: ReturnType<typeof createGesture> | null = null;

// Load photo URIs when modal opens
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      currentIndex.value = props.initialIndex ?? 0;
      isHeaderHidden.value = false;
      dragOffset.value = 0;
      await loadPhotoUris();
      setupDragGesture();
    } else {
      cleanupGesture();
    }
  },
  { immediate: true }
);

watch(
  () => props.photos,
  async () => {
    if (props.isOpen) {
      await loadPhotoUris();
    }
  },
  { deep: true }
);

onMounted(() => {
  if (props.isOpen) {
    loadPhotoUris();
  }
});

onUnmounted(() => {
  cleanupGesture();
});

async function loadPhotoUris() {
  for (const path of props.photos) {
    if (!photoUris.value[path]) {
      photoUris.value[path] = await photoService.getPhotoUri(path);
    }
  }
}

function onSwiperInit(swiper: SwiperType) {
  swiperInstance.value = swiper;
  // Navigate to initial slide
  const index = props.initialIndex ?? 0;
  currentIndex.value = index;
  swiper.slideTo(index, 0);
}

function onSlideChange() {
  if (swiperInstance.value) {
    currentIndex.value = swiperInstance.value.activeIndex;
  }
}

function toggleHeader() {
  isHeaderHidden.value = !isHeaderHidden.value;
}

async function onShare() {
  const currentPhoto = props.photos[currentIndex.value];
  if (currentPhoto) {
    await Haptics.impact({ style: ImpactStyle.Light });
    await photoService.sharePhoto(currentPhoto);
  }
}

function onClose() {
  emit('close');
}

function setupDragGesture() {
  // Wait for next tick to ensure containerRef is available
  setTimeout(() => {
    if (!containerRef.value) return;

    gesture = createGesture({
      el: containerRef.value,
      gestureName: 'photo-drag-dismiss',
      direction: 'y',
      threshold: 15,
      onMove: (detail: GestureDetail) => {
        dragOffset.value = detail.deltaY;
      },
      onEnd: (detail: GestureDetail) => {
        const threshold = 100;
        const velocity = Math.abs(detail.velocityY);

        if (Math.abs(detail.deltaY) > threshold || velocity > 0.5) {
          // Dismiss
          Haptics.impact({ style: ImpactStyle.Light });
          onClose();
        }

        // Reset drag offset with animation
        dragOffset.value = 0;
      },
    });

    gesture.enable();
  }, 100);
}

function cleanupGesture() {
  if (gesture) {
    gesture.destroy();
    gesture = null;
  }
}
</script>

<style>
/* Import Swiper styles */
@import 'swiper/css';

/* Global modal styles (not scoped) */
.photo-viewer-modal {
  --background: #000;
}

.photo-viewer-modal ion-page {
  background: #000;
}
</style>

<style scoped>
ion-header,
ion-footer {
  transition: opacity 0.2s ease;
}

ion-header.header-hidden,
ion-footer.footer-hidden {
  opacity: 0;
  pointer-events: none;
}

ion-toolbar {
  --background: var(--ion-toolbar-background, var(--ion-background-color));
  --border-width: 0;
}

.photo-viewer-content {
  --background: #000;
}

.swiper-container {
  width: 100%;
  height: 100%;
  transition: opacity 0.15s ease;
}

.photo-scroll-container {
  width: 100%;
  height: 100%;
  overflow: scroll;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Enable native pinch-to-zoom */
  touch-action: pinch-zoom pan-x pan-y;
  -webkit-overflow-scrolling: touch;
}

.photo-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  /* Allow the image to be zoomed */
  touch-action: pinch-zoom;
}

:deep(.swiper) {
  width: 100%;
  height: 100%;
}

:deep(.swiper-slide) {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
</style>
