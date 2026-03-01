import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { v4 as uuidv4 } from 'uuid';

const PHOTOS_DIR = 'photos';

class PhotoService {
  async initialize(): Promise<void> {
    try {
      // Ensure photos directory exists
      await Filesystem.mkdir({
        path: PHOTOS_DIR,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch (error) {
      // Directory might already exist
      console.log('Photos directory initialization:', error);
    }
  }

  async capturePhoto(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!image.path) return null;

      return await this.savePhoto(image.path);
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    }
  }

  async pickPhoto(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      if (!image.path) return null;

      return await this.savePhoto(image.path);
    } catch (error) {
      console.error('Error picking photo:', error);
      return null;
    }
  }

  private async savePhoto(sourcePath: string): Promise<string> {
    const fileName = `${uuidv4()}.jpg`;
    const targetPath = `${PHOTOS_DIR}/${fileName}`;

    try {
      // Read the source file
      const fileData = await Filesystem.readFile({
        path: sourcePath,
      });

      // Write to our photos directory
      await Filesystem.writeFile({
        path: targetPath,
        data: fileData.data,
        directory: Directory.Documents,
      });

      return targetPath;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  async deletePhoto(path: string): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path,
        directory: Directory.Documents,
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      // Don't throw - photo might already be deleted
    }
  }

  async deletePhotos(paths: string[]): Promise<void> {
    await Promise.all(paths.map((path) => this.deletePhoto(path)));
  }

  async getPhotoUri(path: string): Promise<string> {
    try {
      const result = await Filesystem.getUri({
        path,
        directory: Directory.Documents,
      });
      // Convert file:// URI to a format WebView can display
      return Capacitor.convertFileSrc(result.uri);
    } catch (error) {
      console.error('Error getting photo URI:', error);
      return '';
    }
  }

  /**
   * Get the native file:// URI for sharing (not converted for WebView)
   */
  async getPhotoFileUri(path: string): Promise<string> {
    const result = await Filesystem.getUri({
      path,
      directory: Directory.Documents,
    });
    return result.uri;
  }

  /**
   * Share a single photo using the native share sheet
   */
  async sharePhoto(path: string): Promise<void> {
    try {
      const fileUri = await this.getPhotoFileUri(path);
      await Share.share({
        url: fileUri,
      });
    } catch (error) {
      console.error('Error sharing photo:', error);
      throw error;
    }
  }

  /**
   * Share multiple photos using the native share sheet
   */
  async sharePhotos(paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    try {
      const fileUris = await Promise.all(paths.map((path) => this.getPhotoFileUri(path)));

      await Share.share({
        files: fileUris,
      });
    } catch (error) {
      console.error('Error sharing photos:', error);
      throw error;
    }
  }
}

export const photoService = new PhotoService();
