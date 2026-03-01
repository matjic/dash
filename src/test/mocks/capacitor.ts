/**
 * Mock implementations for Capacitor plugins used in tests
 */
import { vi } from 'vitest';

// Mock @capacitor/core
export const mockCapacitor = {
  getPlatform: vi.fn(() => 'web'),
  convertFileSrc: vi.fn((uri: string) => uri),
};

// Mock @capacitor/haptics
export const mockHaptics = {
  impact: vi.fn(() => Promise.resolve()),
  notification: vi.fn(() => Promise.resolve()),
  vibrate: vi.fn(() => Promise.resolve()),
  selectionStart: vi.fn(() => Promise.resolve()),
  selectionChanged: vi.fn(() => Promise.resolve()),
  selectionEnd: vi.fn(() => Promise.resolve()),
};

// Mock @capacitor/keyboard
export const mockKeyboard = {
  addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })),
  removeAllListeners: vi.fn(() => Promise.resolve()),
  show: vi.fn(() => Promise.resolve()),
  hide: vi.fn(() => Promise.resolve()),
  setAccessoryBarVisible: vi.fn(() => Promise.resolve()),
  setScroll: vi.fn(() => Promise.resolve()),
  setStyle: vi.fn(() => Promise.resolve()),
  setResizeMode: vi.fn(() => Promise.resolve()),
};

// Mock @capacitor/local-notifications
export const mockLocalNotifications = {
  schedule: vi.fn(() => Promise.resolve({ notifications: [] })),
  cancel: vi.fn(() => Promise.resolve()),
  getPending: vi.fn(() => Promise.resolve({ notifications: [] })),
  requestPermissions: vi.fn(() => Promise.resolve({ display: 'granted' })),
  checkPermissions: vi.fn(() => Promise.resolve({ display: 'granted' })),
  addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })),
  removeAllListeners: vi.fn(() => Promise.resolve()),
};

// Mock @capacitor/camera
export const mockCamera = {
  getPhoto: vi.fn(() =>
    Promise.resolve({
      path: '/mock/photo/path.jpg',
      webPath: 'blob:http://localhost/mock',
      format: 'jpeg',
    }),
  ),
  requestPermissions: vi.fn(() => Promise.resolve({ camera: 'granted', photos: 'granted' })),
  checkPermissions: vi.fn(() => Promise.resolve({ camera: 'granted', photos: 'granted' })),
};

// Mock @capacitor/filesystem
export const mockFilesystem = {
  readFile: vi.fn(() => Promise.resolve({ data: 'base64data' })),
  writeFile: vi.fn(() => Promise.resolve({ uri: '/mock/path' })),
  deleteFile: vi.fn(() => Promise.resolve()),
  mkdir: vi.fn(() => Promise.resolve()),
  rmdir: vi.fn(() => Promise.resolve()),
  readdir: vi.fn(() => Promise.resolve({ files: [] })),
  getUri: vi.fn((options: { path: string }) => Promise.resolve({ uri: `file://${options.path}` })),
  stat: vi.fn(() => Promise.resolve({ type: 'file', size: 0, ctime: 0, mtime: 0, uri: '' })),
  copy: vi.fn(() => Promise.resolve({ uri: '/mock/path' })),
};

// Mock @capacitor/browser
export const mockBrowser = {
  open: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
  addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })),
  removeAllListeners: vi.fn(() => Promise.resolve()),
};

// Mock @capacitor/share
export const mockShare = {
  share: vi.fn(() => Promise.resolve({ activityType: 'mock' })),
  canShare: vi.fn(() => Promise.resolve({ value: true })),
};

// Mock @capacitor-community/sqlite
export const mockSQLiteDBConnection = {
  open: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
  execute: vi.fn(() => Promise.resolve({ changes: { changes: 0, lastId: 0 } })),
  run: vi.fn(() => Promise.resolve({ changes: { changes: 1, lastId: 1 } })),
  query: vi.fn(() => Promise.resolve({ values: [] })),
  isDBOpen: vi.fn(() => Promise.resolve({ result: true })),
};

export const mockSQLiteConnection = {
  createConnection: vi.fn(() => Promise.resolve(mockSQLiteDBConnection)),
  closeConnection: vi.fn(() => Promise.resolve()),
  initWebStore: vi.fn(() => Promise.resolve()),
};

export const mockCapacitorSQLite = {
  createConnection: vi.fn(() => Promise.resolve(mockSQLiteDBConnection)),
  closeConnection: vi.fn(() => Promise.resolve()),
};

// Helper to reset all mocks
export function resetAllMocks() {
  vi.clearAllMocks();
}
