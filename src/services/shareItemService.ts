import { Share } from '@capacitor/share';
import { photoService } from './photoService';
import type { DashItem } from '../models/DashItem';

class ShareItemService {
  /**
   * Share a DashItem via native share sheet
   */
  async shareItem(item: DashItem): Promise<void> {
    const text = this.formatItemForSharing(item);
    const files = await this.getShareableFiles(item);

    await Share.share({
      title: item.title,
      text,
      files: files.length > 0 ? files : undefined,
      dialogTitle: `Share ${item.itemType === 'event' ? 'Event' : 'Task'}`,
    });
  }

  /**
   * Format item as readable text for sharing
   */
  private formatItemForSharing(item: DashItem): string {
    const lines: string[] = [];

    // Title with emoji indicator
    const emoji = item.itemType === 'event' ? '📅' : '☑️';
    lines.push(`${emoji} ${item.title}`);
    lines.push('');

    // Dates
    if (item.itemType === 'event' && item.eventDate) {
      const start = this.formatDate(item.eventDate);
      if (item.endDate) {
        const end = this.formatDate(item.endDate);
        lines.push(`Date: ${start} - ${end}`);
      } else {
        lines.push(`Date: ${start}`);
      }
    } else if (item.itemType === 'task' && item.dueDate) {
      lines.push(`Due: ${this.formatDate(item.dueDate)}`);
    }

    // Location
    if (item.location) {
      lines.push(`Location: ${item.location}`);
    }

    // Priority (for tasks)
    if (item.itemType === 'task' && item.priority && item.priority !== 'none') {
      lines.push(`Priority: ${this.capitalizeFirst(item.priority)}`);
    }

    // Notes
    if (item.notes) {
      lines.push('');
      lines.push('Notes:');
      lines.push(item.notes);
    }

    // Links
    if (item.links.length > 0) {
      lines.push('');
      lines.push('Links:');
      item.links.forEach((link: string) => {
        lines.push(`- ${link}`);
      });
    }

    // Tags
    if (item.tags.length > 0) {
      lines.push('');
      lines.push(`Tags: ${item.tags.map((t: string) => `#${t}`).join(' ')}`);
    }

    // Footer
    lines.push('');
    lines.push('Shared from Dash');

    return lines.join('\n');
  }

  /**
   * Get file:// URIs for photos to include in share
   */
  private async getShareableFiles(item: DashItem): Promise<string[]> {
    const files: string[] = [];

    for (const photoPath of item.photoPaths) {
      try {
        const uri = await photoService.getPhotoFileUri(photoPath);
        files.push(uri);
      } catch (error) {
        console.error('Failed to get photo URI for sharing:', error);
      }
    }

    return files;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const shareItemService = new ShareItemService();
