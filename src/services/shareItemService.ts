import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import type { DashItem } from '../models/DashItem';

class ShareItemService {
  /**
   * Share a DashItem via native share sheet as a rich note
   * Creates a single HTML file with embedded images for a cohesive share experience
   */
  async shareItem(item: DashItem): Promise<void> {
    // On native platforms, create a rich HTML file with embedded images
    if (Capacitor.isNativePlatform()) {
      const htmlUri = await this.createShareableHtmlFile(item);
      if (htmlUri) {
        await Share.share({
          title: item.title,
          files: [htmlUri],
          dialogTitle: `Share ${item.itemType === 'event' ? 'Event' : 'Task'}`,
        });
        
        // Clean up after a delay to allow share to complete
        setTimeout(() => this.cleanupTempFiles(), 5000);
        return;
      }
    }

    // Fallback to plain text sharing
    await Share.share({
      title: item.title,
      text: this.formatItemAsPlainText(item),
      dialogTitle: `Share ${item.itemType === 'event' ? 'Event' : 'Task'}`,
    });
  }

  /**
   * Create a temporary HTML file for rich sharing with embedded images
   */
  private async createShareableHtmlFile(item: DashItem): Promise<string | null> {
    try {
      // Load images as base64 for embedding
      const embeddedImages: string[] = [];
      for (const photoPath of item.photoPaths) {
        try {
          const base64 = await this.getPhotoAsBase64(photoPath);
          if (base64) {
            embeddedImages.push(base64);
          }
        } catch (error) {
          console.error('Failed to load photo for embedding:', error);
        }
      }

      const html = this.generateHtml(item, embeddedImages);
      const fileName = `${this.sanitizeFileName(item.title)}.html`;
      
      // Ensure tmp directory exists
      try {
        await Filesystem.mkdir({
          path: 'tmp',
          directory: Directory.Cache,
          recursive: true,
        });
      } catch {
        // Directory might exist
      }
      
      await Filesystem.writeFile({
        path: `tmp/${fileName}`,
        data: html,
        directory: Directory.Cache,
        encoding: 'utf8' as any,
      });

      const result = await Filesystem.getUri({
        path: `tmp/${fileName}`,
        directory: Directory.Cache,
      });

      return result.uri;
    } catch (error) {
      console.error('Failed to create shareable HTML file:', error);
      return null;
    }
  }

  /**
   * Get a photo as base64 data URI
   */
  private async getPhotoAsBase64(photoPath: string): Promise<string | null> {
    try {
      const result = await Filesystem.readFile({
        path: photoPath,
        directory: Directory.Documents,
      });
      
      // result.data is already base64 on native platforms
      if (typeof result.data === 'string') {
        return `data:image/jpeg;base64,${result.data}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to read photo as base64:', error);
      return null;
    }
  }

  /**
   * Sanitize a string for use as a filename
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) || 'dash-item';
  }

  /**
   * Generate beautiful HTML for the shared item with embedded images
   */
  private generateHtml(item: DashItem, embeddedImages: string[] = []): string {
    const isEvent = item.itemType === 'event';
    const accentColor = isEvent ? '#5856D6' : '#007AFF'; // Purple for events, blue for tasks
    const emoji = isEvent ? '📅' : '☑️';
    const typeLabel = isEvent ? 'Event' : 'Task';

    let dateSection = '';
    if (isEvent && item.eventDate) {
      const start = this.formatDateNice(item.eventDate);
      if (item.endDate) {
        const end = this.formatDateNice(item.endDate);
        dateSection = `
          <div class="meta-item">
            <span class="meta-icon">🗓</span>
            <span class="meta-text">${start} → ${end}</span>
          </div>`;
      } else {
        dateSection = `
          <div class="meta-item">
            <span class="meta-icon">🗓</span>
            <span class="meta-text">${start}</span>
          </div>`;
      }
    } else if (!isEvent && item.dueDate) {
      dateSection = `
        <div class="meta-item">
          <span class="meta-icon">📆</span>
          <span class="meta-text">Due: ${this.formatDateNice(item.dueDate)}</span>
        </div>`;
    }

    let locationSection = '';
    if (item.location) {
      locationSection = `
        <div class="meta-item">
          <span class="meta-icon">📍</span>
          <span class="meta-text">${this.escapeHtml(item.location)}</span>
        </div>`;
    }

    let prioritySection = '';
    if (!isEvent && item.priority && item.priority !== 'none') {
      const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      prioritySection = `
        <div class="meta-item">
          <span class="meta-icon">${priorityEmoji}</span>
          <span class="meta-text">${this.capitalizeFirst(item.priority)} Priority</span>
        </div>`;
    }

    let notesSection = '';
    if (item.notes) {
      notesSection = `
        <div class="section">
          <div class="section-title">Notes</div>
          <div class="notes-content">${this.escapeHtml(item.notes).replace(/\n/g, '<br>')}</div>
        </div>`;
    }

    let linksSection = '';
    if (item.links.length > 0) {
      const linkItems = item.links
        .map((link: string) => `<a href="${this.escapeHtml(link)}" class="link-item">${this.escapeHtml(this.formatLinkDisplay(link))}</a>`)
        .join('');
      linksSection = `
        <div class="section">
          <div class="section-title">Links</div>
          <div class="links-list">${linkItems}</div>
        </div>`;
    }

    let tagsSection = '';
    if (item.tags.length > 0) {
      const tagItems = item.tags
        .map((tag: string) => `<span class="tag">#${this.escapeHtml(tag)}</span>`)
        .join('');
      tagsSection = `
        <div class="tags-container">${tagItems}</div>`;
    }

    let photosSection = '';
    if (embeddedImages.length > 0) {
      const photoItems = embeddedImages
        .map((src) => `<img src="${src}" class="photo" alt="Photo">`)
        .join('');
      photosSection = `
        <div class="section">
          <div class="section-title">Photos</div>
          <div class="photos-grid">${photoItems}</div>
        </div>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${this.escapeHtml(item.title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
      background: #f5f5f7;
      color: #1d1d1f;
      line-height: 1.5;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 500px;
      margin: 0 auto;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }
    .emoji {
      font-size: 28px;
      line-height: 1;
    }
    .title-container {
      flex: 1;
    }
    .type-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${accentColor};
      background: ${accentColor}15;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .title {
      font-size: 22px;
      font-weight: 600;
      color: #1d1d1f;
      line-height: 1.3;
    }
    .meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
      padding: 12px;
      background: #f5f5f7;
      border-radius: 10px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .meta-icon {
      font-size: 16px;
      width: 24px;
      text-align: center;
    }
    .meta-text {
      font-size: 15px;
      color: #424245;
    }
    .section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #86868b;
      margin-bottom: 8px;
    }
    .notes-content {
      font-size: 15px;
      color: #424245;
      white-space: pre-wrap;
    }
    .links-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .link-item {
      color: ${accentColor};
      text-decoration: none;
      font-size: 15px;
      word-break: break-all;
    }
    .link-item:hover {
      text-decoration: underline;
    }
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 16px;
    }
    .tag {
      font-size: 13px;
      color: ${accentColor};
      background: ${accentColor}12;
      padding: 4px 10px;
      border-radius: 12px;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 8px;
    }
    .photo {
      width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
    }
    .footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e7;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      color: #86868b;
    }
    .dash-logo {
      font-weight: 600;
      color: #1d1d1f;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="emoji">${emoji}</span>
      <div class="title-container">
        <div class="type-badge">${typeLabel}</div>
        <h1 class="title">${this.escapeHtml(item.title)}</h1>
      </div>
    </div>
    
    ${(dateSection || locationSection || prioritySection) ? `
    <div class="meta">
      ${dateSection}
      ${locationSection}
      ${prioritySection}
    </div>` : ''}
    
    ${notesSection}
    ${linksSection}
    ${photosSection}
    ${tagsSection}
    
    <div class="footer">
      <span class="footer-text">Shared from <span class="dash-logo">Dash</span></span>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Format item as clean plain text (fallback for apps that don't support HTML)
   */
  private formatItemAsPlainText(item: DashItem): string {
    const lines: string[] = [];
    const isEvent = item.itemType === 'event';

    // Title with type indicator
    lines.push(`${isEvent ? '📅' : '☑️'} ${item.title}`);
    lines.push('');

    // Date
    if (isEvent && item.eventDate) {
      const start = this.formatDateNice(item.eventDate);
      if (item.endDate) {
        lines.push(`🗓 ${start} → ${this.formatDateNice(item.endDate)}`);
      } else {
        lines.push(`🗓 ${start}`);
      }
    } else if (!isEvent && item.dueDate) {
      lines.push(`📆 Due: ${this.formatDateNice(item.dueDate)}`);
    }

    // Location
    if (item.location) {
      lines.push(`📍 ${item.location}`);
    }

    // Priority
    if (!isEvent && item.priority && item.priority !== 'none') {
      const emoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      lines.push(`${emoji} ${this.capitalizeFirst(item.priority)} Priority`);
    }

    // Notes
    if (item.notes) {
      lines.push('');
      lines.push(item.notes);
    }

    // Links
    if (item.links.length > 0) {
      lines.push('');
      item.links.forEach((link: string) => {
        lines.push(`🔗 ${link}`);
      });
    }

    // Tags
    if (item.tags.length > 0) {
      lines.push('');
      lines.push(item.tags.map((t: string) => `#${t}`).join(' '));
    }

    // Footer
    lines.push('');
    lines.push('— Shared from Dash');

    return lines.join('\n');
  }

  /**
   * Clean up temporary share files
   */
  private async cleanupTempFiles(): Promise<void> {
    try {
      const files = await Filesystem.readdir({
        path: 'tmp',
        directory: Directory.Cache,
      });

      for (const file of files.files) {
        if (file.name.startsWith('dash-share-')) {
          await Filesystem.deleteFile({
            path: `tmp/${file.name}`,
            directory: Directory.Cache,
          });
        }
      }
    } catch {
      // tmp directory might not exist, that's fine
    }
  }

  /**
   * Format date in a nice, readable way
   */
  private formatDateNice(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const isThisYear = date.getFullYear() === now.getFullYear();
    
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: isThisYear ? undefined : 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Format a URL for display (show domain + path start)
   */
  private formatLinkDisplay(url: string): string {
    try {
      const parsed = new URL(url);
      const display = parsed.hostname + parsed.pathname;
      return display.length > 40 ? display.substring(0, 37) + '...' : display;
    } catch {
      return url.length > 40 ? url.substring(0, 37) + '...' : url;
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const shareItemService = new ShareItemService();
