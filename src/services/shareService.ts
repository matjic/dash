import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import type { Attachment } from '../models/DashItem';

/**
 * Data structure shared between the Share Extension and the main app
 * Must match SharedData in ShareViewController.swift
 */
export interface SharedData {
  imagePaths: string[];
  urls: string[];
  text: string | null;
  filePaths: string[];
}

/**
 * Processed shared data ready for use in ItemDetail
 */
export interface ProcessedSharedData {
  photoPaths: string[];
  links: string[];
  notes: string;
  attachments: Attachment[];
  suggestedTitle: string;
}

// Store pending shared data for consumption by ItemDetail
let pendingSharedData: ProcessedSharedData | null = null;

/**
 * Read shared items from the App Group container
 * This is called when the app receives a dash://share deep link
 */
async function readSharedItems(): Promise<SharedData | null> {
  // Since we can't directly access App Group from JavaScript,
  // we need to use a workaround:
  // 
  // Option 1: Use a Capacitor plugin that bridges to native code
  // Option 2: Have the Share Extension copy data to a location accessible to WebView
  // Option 3: Encode small data directly in the deep link URL
  //
  // For now, we'll implement Option 2:
  // The Share Extension copies files to a known location and writes metadata
  
  try {
    // Try to read from Documents/shared-incoming/shared-items.json
    // The native code should copy data here before opening the app
    const result = await Filesystem.readFile({
      path: 'shared-incoming/shared-items.json',
      directory: Directory.Documents,
      encoding: 'utf8' as any,
    });

    if (typeof result.data === 'string') {
      return JSON.parse(result.data) as SharedData;
    }
    return null;
  } catch (error) {
    console.log('No pending shared items found:', error);
    return null;
  }
}

/**
 * Clear the shared items file after processing
 */
async function clearSharedItems(): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path: 'shared-incoming/shared-items.json',
      directory: Directory.Documents,
    });
  } catch (error) {
    // File might not exist, that's okay
    console.log('Could not clear shared items:', error);
  }
}

/**
 * Copy an image from the staging area to the app's photos directory
 */
async function copyImageToPhotos(sourcePath: string): Promise<string | null> {
  try {
    const id = uuidv4();
    const destPath = `photos/${id}.jpg`;

    // Ensure photos directory exists
    try {
      await Filesystem.mkdir({
        path: 'photos',
        directory: Directory.Documents,
        recursive: true,
      });
    } catch {
      // Directory might already exist
    }

    // Read from source and write to destination
    const sourceData = await Filesystem.readFile({
      path: sourcePath,
    });

    await Filesystem.writeFile({
      path: destPath,
      data: sourceData.data,
      directory: Directory.Documents,
    });

    return destPath;
  } catch (error) {
    console.error('Failed to copy image:', error);
    return null;
  }
}

/**
 * Copy a file from the staging area to the app's attachments directory
 */
async function copyFileToAttachments(sourcePath: string): Promise<Attachment | null> {
  try {
    const id = uuidv4();
    const fileName = sourcePath.split('/').pop() || 'file';
    const destPath = `attachments/${id}_${fileName}`;

    // Ensure attachments directory exists
    try {
      await Filesystem.mkdir({
        path: 'attachments',
        directory: Directory.Documents,
        recursive: true,
      });
    } catch {
      // Directory might already exist
    }

    // Read from source and write to destination
    const sourceData = await Filesystem.readFile({
      path: sourcePath,
    });

    await Filesystem.writeFile({
      path: destPath,
      data: sourceData.data,
      directory: Directory.Documents,
    });

    // Get file info
    const stat = await Filesystem.stat({
      path: destPath,
      directory: Directory.Documents,
    });

    return {
      id,
      name: fileName,
      path: destPath,
      mimeType: getMimeType(fileName),
      size: stat.size,
      createdDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to copy file:', error);
    return null;
  }
}

/**
 * Get MIME type from filename extension
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    rtf: 'application/rtf',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    zip: 'application/zip',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Generate a suggested title from the shared content
 */
function generateSuggestedTitle(data: SharedData): string {
  // Use first line of text if available
  if (data.text) {
    const firstLine = data.text.split('\n')[0]?.trim() ?? '';
    if (firstLine.length > 0 && firstLine.length <= 100) {
      return firstLine;
    }
    if (firstLine.length > 100) {
      return firstLine.substring(0, 97) + '...';
    }
  }

  // Use URL domain if available
  if (data.urls.length > 0) {
    const firstUrl = data.urls[0];
    if (firstUrl) {
      try {
        const url = new URL(firstUrl);
        return `Link from ${url.hostname}`;
      } catch {
        return 'Shared Link';
      }
    }
  }

  // Use filename if available
  if (data.filePaths.length > 0) {
    const firstPath = data.filePaths[0];
    const fileName = firstPath?.split('/').pop() ?? 'file';
    return `File: ${fileName}`;
  }

  // Use image count
  if (data.imagePaths.length > 0) {
    return data.imagePaths.length === 1 ? 'Shared Image' : `${data.imagePaths.length} Shared Images`;
  }

  return 'Shared Item';
}

/**
 * Process pending shared items from the Share Extension
 * Returns processed data ready for use in ItemDetail
 */
export async function processPendingShares(): Promise<ProcessedSharedData | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const sharedData = await readSharedItems();
    if (!sharedData) {
      return null;
    }

    const processed: ProcessedSharedData = {
      photoPaths: [],
      links: sharedData.urls,
      notes: sharedData.text || '',
      attachments: [],
      suggestedTitle: generateSuggestedTitle(sharedData),
    };

    // Copy images to photos directory
    for (const imagePath of sharedData.imagePaths) {
      const newPath = await copyImageToPhotos(imagePath);
      if (newPath) {
        processed.photoPaths.push(newPath);
      }
    }

    // Copy files to attachments directory
    for (const filePath of sharedData.filePaths) {
      const attachment = await copyFileToAttachments(filePath);
      if (attachment) {
        processed.attachments.push(attachment);
      }
    }

    // Clear the shared items
    await clearSharedItems();

    return processed;
  } catch (error) {
    console.error('Error processing shared items:', error);
    return null;
  }
}

/**
 * Store processed shared data for consumption by ItemDetail
 */
export function setPendingSharedData(data: ProcessedSharedData | null): void {
  pendingSharedData = data;
}

/**
 * Get and clear pending shared data
 */
export function consumePendingSharedData(): ProcessedSharedData | null {
  const data = pendingSharedData;
  pendingSharedData = null;
  return data;
}

/**
 * Check if there's pending shared data
 */
export function hasPendingSharedData(): boolean {
  return pendingSharedData !== null;
}
