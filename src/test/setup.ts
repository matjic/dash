/**
 * Global test setup for Vitest
 * This file is loaded before each test file
 */
import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import {
  mockCapacitor,
  mockHaptics,
  mockKeyboard,
  mockLocalNotifications,
  mockCamera,
  mockFilesystem,
  mockBrowser,
  mockShare,
  mockCapacitorSQLite,
  mockSQLiteConnection,
} from './mocks/capacitor';

// Mock Capacitor core
vi.mock('@capacitor/core', () => ({
  Capacitor: mockCapacitor,
}));

// Mock Capacitor Haptics
vi.mock('@capacitor/haptics', () => ({
  Haptics: mockHaptics,
  ImpactStyle: {
    Heavy: 'HEAVY',
    Medium: 'MEDIUM',
    Light: 'LIGHT',
  },
  NotificationType: {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR',
  },
}));

// Mock Capacitor Keyboard
vi.mock('@capacitor/keyboard', () => ({
  Keyboard: mockKeyboard,
}));

// Mock Capacitor Local Notifications
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: mockLocalNotifications,
}));

// Mock Capacitor Camera
vi.mock('@capacitor/camera', () => ({
  Camera: mockCamera,
  CameraResultType: {
    Uri: 'uri',
    Base64: 'base64',
    DataUrl: 'dataUrl',
  },
  CameraSource: {
    Camera: 'CAMERA',
    Photos: 'PHOTOS',
    Prompt: 'PROMPT',
  },
}));

// Mock Capacitor Filesystem
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: mockFilesystem,
  Directory: {
    Documents: 'DOCUMENTS',
    Data: 'DATA',
    Library: 'LIBRARY',
    Cache: 'CACHE',
    External: 'EXTERNAL',
    ExternalStorage: 'EXTERNAL_STORAGE',
  },
  Encoding: {
    UTF8: 'utf8',
    ASCII: 'ascii',
    UTF16: 'utf16',
  },
}));

// Mock Capacitor Browser
vi.mock('@capacitor/browser', () => ({
  Browser: mockBrowser,
}));

// Mock Capacitor Share
vi.mock('@capacitor/share', () => ({
  Share: mockShare,
}));

// Mock Capacitor SQLite
vi.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: mockCapacitorSQLite,
  SQLiteConnection: vi.fn(() => mockSQLiteConnection),
  SQLiteDBConnection: vi.fn(),
}));

// Mock Ionic Vue components at module level
vi.mock('@ionic/vue', async () => {
  const actual = await vi.importActual('@ionic/vue');
  return {
    ...actual,
    IonIcon: { template: '<span class="ion-icon"></span>' },
    IonSegment: {
      template: '<div class="ion-segment" :value="value" @ionChange="$attrs.onIonChange"><slot /></div>',
      props: ['value', 'modelValue'],
    },
    IonSegmentButton: {
      template: '<button class="ion-segment-button" :value="value"><slot /></button>',
      props: ['value'],
    },
    IonLabel: { template: '<div class="ion-label"><slot /></div>' },
    IonItem: {
      template: '<div class="ion-item" @click="$emit(\'click\')"><slot /></div>',
      emits: ['click'],
    },
    IonItemSliding: { template: '<div class="ion-item-sliding"><slot /></div>' },
    IonItemOptions: { template: '<div class="ion-item-options"><slot /></div>' },
    IonItemOption: {
      template: '<button class="ion-item-option" @click="$emit(\'click\')"><slot /></button>',
      emits: ['click'],
    },
    IonBadge: { template: '<span class="ion-badge"><slot /></span>' },
  };
});

// Configure Vue Test Utils
config.global.stubs = {
  // Stub Ionic components to avoid complex setup
  IonPage: { template: '<div class="ion-page"><slot /></div>' },
  IonContent: { template: '<div class="ion-content"><slot /></div>' },
  IonHeader: { template: '<div class="ion-header"><slot /></div>' },
  IonToolbar: { template: '<div class="ion-toolbar"><slot /></div>' },
  IonTitle: { template: '<div class="ion-title"><slot /></div>' },
  IonButtons: { template: '<div class="ion-buttons"><slot /></div>' },
  IonButton: { template: '<button class="ion-button"><slot /></button>' },
  IonBackButton: { template: '<button class="ion-back-button"><slot /></button>' },
  IonList: { template: '<div class="ion-list"><slot /></div>' },
  IonItem: {
    template: '<div class="ion-item" @click="$emit(\'click\')"><slot /></div>',
    emits: ['click'],
  },
  IonItemSliding: { template: '<div class="ion-item-sliding"><slot /></div>' },
  IonItemOptions: { template: '<div class="ion-item-options"><slot /></div>' },
  IonItemOption: {
    template: '<button class="ion-item-option" @click="$emit(\'click\')"><slot /></button>',
    emits: ['click'],
  },
  IonLabel: { template: '<div class="ion-label"><slot /></div>' },
  IonInput: {
    template: '<input class="ion-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
  IonTextarea: {
    template: '<textarea class="ion-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
  IonIcon: { template: '<span class="ion-icon"></span>' },
  IonBadge: { template: '<span class="ion-badge"><slot /></span>' },
  IonSpinner: { template: '<span class="ion-spinner"></span>' },
  IonSegment: {
    template: '<div class="ion-segment"><slot /></div>',
    props: ['modelValue'],
    emits: ['update:modelValue', 'ionChange'],
  },
  IonSegmentButton: {
    template: '<button class="ion-segment-button" @click="$emit(\'click\')"><slot /></button>',
    props: ['value'],
    emits: ['click'],
  },
  IonFab: { template: '<div class="ion-fab"><slot /></div>' },
  IonFabButton: { template: '<button class="ion-fab-button"><slot /></button>' },
  IonSelect: {
    template: '<select class="ion-select"><slot /></select>',
    props: ['modelValue'],
    emits: ['update:modelValue', 'ionChange'],
  },
  IonSelectOption: { template: '<option class="ion-select-option"><slot /></option>' },
  IonDatetime: {
    template: '<input type="datetime-local" class="ion-datetime" />',
    props: ['modelValue', 'presentation'],
    emits: ['update:modelValue', 'ionChange'],
  },
  IonToggle: {
    template: '<input type="checkbox" class="ion-toggle" />',
    props: ['modelValue'],
    emits: ['update:modelValue', 'ionChange'],
  },
  IonChip: { template: '<span class="ion-chip"><slot /></span>' },
  IonModal: { template: '<div class="ion-modal"><slot /></div>' },
  IonAlert: { template: '<div class="ion-alert"><slot /></div>' },
  IonActionSheet: { template: '<div class="ion-action-sheet"><slot /></div>' },
};

// Mock window.matchMedia for dark mode tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock customElements.whenDefined for SQLite web component
Object.defineProperty(window, 'customElements', {
  writable: true,
  value: {
    whenDefined: vi.fn(() => Promise.resolve()),
    define: vi.fn(),
    get: vi.fn(),
  },
});

// Export mocks for use in tests
export {
  mockCapacitor,
  mockHaptics,
  mockKeyboard,
  mockLocalNotifications,
  mockCamera,
  mockFilesystem,
  mockBrowser,
  mockShare,
  mockCapacitorSQLite,
  mockSQLiteConnection,
};
