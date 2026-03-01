import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useIonRouter } from '@ionic/vue';
import { v4 as uuidv4 } from 'uuid';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { alertController } from '@ionic/vue';
import { useItems } from './useItems';
import { photoService } from '../services/photoService';
import { consumePendingSharedData } from '../services/shareService';
import type { DashItem, Comment } from '../models/DashItem';
import { createEmptyItem } from '../models/DashItem';

export function useItemDetail() {
  const route = useRoute();
  const ionRouter = useIonRouter();
  const { items, createItem, updateItem } = useItems();

  // Core state
  const originalItemId = ref<string | undefined>(undefined);
  const isExistingItem = computed(() => !!originalItemId.value);
  const isViewMode = ref(true);
  const item = reactive<DashItem>(createEmptyItem());
  const originalItemSnapshot = ref<DashItem | null>(null);

  // Photo URI caches
  const photoUris = ref<Record<string, string>>({});
  const commentPhotoUris = ref<Record<string, string>>({});

  // Photo viewer state
  const isPhotoViewerOpen = ref(false);
  const photoViewerIndex = ref(0);

  // Comment input state
  const newCommentText = ref('');

  const canSave = computed(() => item.title.trim().length > 0);

  const sortedComments = computed(() => {
    if (!item.comments || item.comments.length === 0) return [];
    return [...item.comments].sort((a, b) => {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
  });

  const headerTitle = computed(() => {
    if (isViewMode.value && isExistingItem.value) {
      return 'Task';
    }
    return isExistingItem.value ? 'Edit Task' : 'New Task';
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

  // Photo URI management
  async function loadPhotoUris() {
    for (const path of item.photoPaths) {
      if (!photoUris.value[path]) {
        photoUris.value[path] = await photoService.getPhotoUri(path);
      }
    }
  }

  async function loadCommentPhotoUris() {
    if (!item.comments) return;
    for (const comment of item.comments) {
      if (comment.imagePath && !commentPhotoUris.value[comment.imagePath]) {
        commentPhotoUris.value[comment.imagePath] = await photoService.getPhotoUri(
          comment.imagePath,
        );
      }
    }
  }

  // Initialization
  onMounted(async () => {
    const paramId = route.params.id as string | undefined;
    const queryTitle = route.query.title as string | undefined;

    if (paramId && paramId !== 'new') {
      originalItemId.value = paramId;
      const existingItem = items.value.find((i) => i.id === paramId);
      if (existingItem) {
        Object.assign(item, existingItem);
        originalItemSnapshot.value = JSON.parse(JSON.stringify(existingItem));
        isViewMode.value = true;
        await loadPhotoUris();
        await loadCommentPhotoUris();
      } else {
        ionRouter.back();
      }
    } else {
      isViewMode.value = false;

      const queryShared = route.query.shared as string | undefined;
      if (queryShared === 'true') {
        const sharedData = consumePendingSharedData();
        if (sharedData) {
          item.title = sharedData.suggestedTitle;
          item.notes = sharedData.notes;
          item.links = sharedData.links;
          item.photoPaths = sharedData.photoPaths;
          item.attachments = sharedData.attachments;
          await loadPhotoUris();
        }
      }

      if (queryTitle) {
        item.title = queryTitle;
      }
    }
  });

  watch(() => item.photoPaths, loadPhotoUris, { deep: true });
  watch(() => item.comments, loadCommentPhotoUris, { deep: true });

  // Mode switching
  function enterEditMode() {
    originalItemSnapshot.value = JSON.parse(JSON.stringify(item));
    isViewMode.value = false;
  }

  function exitEditMode() {
    if (originalItemSnapshot.value) {
      Object.assign(item, originalItemSnapshot.value);
    }
    isViewMode.value = true;
  }

  function onBack() {
    ionRouter.back();
  }

  // Photo viewer
  function viewPhoto(index: number) {
    photoViewerIndex.value = index;
    isPhotoViewerOpen.value = true;
  }

  function closePhotoViewer() {
    isPhotoViewerOpen.value = false;
  }

  async function removePhoto(index: number) {
    const path = item.photoPaths[index];
    if (!path) return;

    if (isExistingItem.value) {
      await photoService.deletePhoto(path);
    }

    item.photoPaths.splice(index, 1);
    delete photoUris.value[path];
  }

  // Comment CRUD
  function addComment(text: string, imagePath?: string) {
    if (!item.comments) {
      item.comments = [];
    }

    const newComment: Comment = {
      id: uuidv4(),
      text,
      imagePath,
      createdDate: new Date().toISOString(),
    };

    item.comments.push(newComment);

    if (isExistingItem.value && isViewMode.value) {
      saveItemQuietly();
    }
  }

  function handleAddComment() {
    const text = newCommentText.value.trim();
    if (text) {
      addComment(text);
      newCommentText.value = '';
    }
  }

  async function handleAddCommentWithPhoto() {
    const text = newCommentText.value.trim();
    await addCommentWithPhoto(text);
    newCommentText.value = '';
  }

  async function addCommentWithPhoto(text: string) {
    const { actionSheetController } = await import('@ionic/vue');
    const actionSheet = await actionSheetController.create({
      header: 'Add Photo',
      buttons: [
        {
          text: 'Take Photo',
          handler: async () => {
            const path = await photoService.capturePhoto();
            if (path) {
              addComment(text, path);
              commentPhotoUris.value[path] = await photoService.getPhotoUri(path);
            }
          },
        },
        {
          text: 'Choose from Library',
          handler: async () => {
            const path = await photoService.pickPhoto();
            if (path) {
              addComment(text, path);
              commentPhotoUris.value[path] = await photoService.getPhotoUri(path);
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

  function updateComment(commentId: string, text: string) {
    if (!item.comments) return;

    const commentIndex = item.comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) return;

    const existingComment = item.comments[commentIndex];
    if (!existingComment) return;

    item.comments[commentIndex] = {
      id: existingComment.id,
      text,
      imagePath: existingComment.imagePath,
      createdDate: existingComment.createdDate,
      updatedDate: new Date().toISOString(),
    };

    if (isExistingItem.value && isViewMode.value) {
      saveItemQuietly();
    }
  }

  async function deleteComment(comment: Comment) {
    const commentIndex = item.comments?.findIndex((c) => c.id === comment.id);
    if (commentIndex !== undefined && commentIndex !== -1 && item.comments) {
      if (comment.imagePath) {
        await photoService.deletePhoto(comment.imagePath);
        delete commentPhotoUris.value[comment.imagePath];
      }

      item.comments.splice(commentIndex, 1);

      if (isExistingItem.value && isViewMode.value) {
        saveItemQuietly();
      }
    }
  }

  function viewCommentPhoto(imagePath: string) {
    const comment = item.comments?.find((c) => c.imagePath === imagePath);
    if (comment) {
      window.open(commentPhotoUris.value[imagePath], '_blank');
    }
  }

  // Save
  async function saveItemQuietly() {
    try {
      if (originalItemId.value) {
        await updateItem({ ...item, id: originalItemId.value } as DashItem);
        originalItemSnapshot.value = JSON.parse(JSON.stringify(item));
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  }

  async function onSave() {
    if (!canSave.value) return;

    try {
      if (isExistingItem.value && originalItemId.value) {
        await updateItem({ ...item, id: originalItemId.value } as DashItem);
        originalItemSnapshot.value = JSON.parse(JSON.stringify(item));
        isViewMode.value = true;
      } else {
        await createItem(item as Omit<DashItem, 'id' | 'createdDate'>);
        ionRouter.back();
      }

      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
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

  return {
    // State
    item,
    originalItemId,
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

    // Mode
    enterEditMode,
    exitEditMode,
    onBack,

    // Photos
    viewPhoto,
    closePhotoViewer,
    removePhoto,

    // Comments
    addComment,
    handleAddComment,
    handleAddCommentWithPhoto,
    updateComment,
    deleteComment,
    viewCommentPhoto,

    // Save
    saveItemQuietly,
    onSave,
  };
}
