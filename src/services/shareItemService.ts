import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { photoService } from './photoService';
import { formatDateNice, formatDateShort } from '../utils/date';
import { capitalizeFirst } from '../utils/string';
import type { DashItem } from '../models/DashItem';

class ShareItemService {
  /**
   * Share a DashItem as plain text with separate image attachments
   * This format is universally compatible with Notes, Messages, Mail, etc.
   */
  async shareAsText(item: DashItem): Promise<void> {
    const text = this.formatItemAsPlainText(item);
    const files = await this.getShareableFiles(item);

    await Share.share({
      title: item.title,
      text,
      files: files.length > 0 ? files : undefined,
      dialogTitle: 'Share',
    });
  }

  /**
   * Export a DashItem as a formatted PDF with embedded images
   */
  async exportAsPdf(item: DashItem): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to text sharing on web
      await this.shareAsText(item);
      return;
    }

    try {
      // Generate HTML with embedded images
      const html = await this.generatePdfHtml(item);
      const fileName = this.sanitizeFileName(item.title);

      // Call native plugin to generate PDF
      const { PdfGenerator } = await import('./pdfService');
      const result = await PdfGenerator.generatePdf({
        html,
        fileName,
      });
      const pdfUri = result.uri;

      // Share the PDF file
      await Share.share({
        title: `${item.title}.pdf`,
        files: [pdfUri],
        dialogTitle: 'Export PDF',
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      // Fallback to text sharing
      await this.shareAsText(item);
    }
  }

  /**
   * Format item as clean plain text
   */
  private formatItemAsPlainText(item: DashItem): string {
    const lines: string[] = [];

    // Title with type indicator
    lines.push(`☑️ ${item.title}`);
    lines.push('');

    // Due Date
    if (item.dueDate) {
      lines.push(`📆 Due: ${formatDateNice(item.dueDate)}`);
    }

    // Location
    if (item.location) {
      lines.push(`📍 ${item.location}`);
    }

    // Priority
    if (item.priority && item.priority !== 'none') {
      const emoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      lines.push(`${emoji} ${capitalizeFirst(item.priority)} Priority`);
    }

    // Recurrence
    if (item.isRecurring && item.recurrenceRule) {
      lines.push(`🔁 Repeats ${item.recurrenceRule}`);
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

    // Comments
    if (item.comments && item.comments.length > 0) {
      lines.push('');
      lines.push('— Comments —');
      const sortedComments = [...item.comments].sort(
        (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
      );
      for (const comment of sortedComments) {
        const date = formatDateShort(comment.createdDate);
        lines.push(`${date}: ${comment.text}`);
      }
    }

    // Tags
    if (item.tags.length > 0) {
      lines.push('');
      lines.push(item.tags.map((t: string) => `#${t}`).join(' '));
    }

    // Footer with timestamps
    lines.push('');
    lines.push('—');
    lines.push(`Created: ${formatDateShort(item.createdDate)}`);
    if (item.updatedDate) {
      lines.push(`Updated: ${formatDateShort(item.updatedDate)}`);
    }
    lines.push('Shared from Dash');

    return lines.join('\n');
  }

  /**
   * Generate HTML for PDF export with embedded images
   */
  private async generatePdfHtml(item: DashItem): Promise<string> {
    const accentColor = '#007AFF';
    const emoji = '☑️';
    const typeLabel = 'Task';

    // Load images as base64
    const embeddedImages: string[] = [];
    for (const photoPath of item.photoPaths) {
      try {
        const base64 = await this.getPhotoAsBase64(photoPath);
        if (base64) {
          embeddedImages.push(base64);
        }
      } catch (error) {
        console.error('Failed to load photo for PDF:', error);
      }
    }

    // Load comment images
    const commentImages: Record<string, string> = {};
    if (item.comments) {
      for (const comment of item.comments) {
        if (comment.imagePath) {
          try {
            const base64 = await this.getPhotoAsBase64(comment.imagePath);
            if (base64) {
              commentImages[comment.id] = base64;
            }
          } catch (error) {
            console.error('Failed to load comment image for PDF:', error);
          }
        }
      }
    }

    // Build sections
    let dateSection = '';
    if (item.dueDate) {
      dateSection = `<div class="meta-item"><span class="meta-icon">📆</span><span>Due: ${formatDateNice(item.dueDate)}</span></div>`;
    }

    let locationSection = '';
    if (item.location) {
      locationSection = `<div class="meta-item"><span class="meta-icon">📍</span><span>${this.escapeHtml(item.location)}</span></div>`;
    }

    let prioritySection = '';
    if (item.priority && item.priority !== 'none') {
      const priorityEmoji =
        item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      prioritySection = `<div class="meta-item"><span class="meta-icon">${priorityEmoji}</span><span>${capitalizeFirst(item.priority)} Priority</span></div>`;
    }

    let recurrenceSection = '';
    if (item.isRecurring && item.recurrenceRule) {
      recurrenceSection = `<div class="meta-item"><span class="meta-icon">🔁</span><span>Repeats ${item.recurrenceRule}</span></div>`;
    }

    const statusSection = `<div class="meta-item"><span class="meta-icon">${item.isCompleted ? '✅' : '⬜'}</span><span>${item.isCompleted ? 'Completed' : 'Not completed'}</span></div>`;

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
        .map((link: string) => `<div class="link-item">🔗 ${this.escapeHtml(link)}</div>`)
        .join('');
      linksSection = `
        <div class="section">
          <div class="section-title">Links</div>
          ${linkItems}
        </div>`;
    }

    let photosSection = '';
    if (embeddedImages.length > 0) {
      const photoItems = embeddedImages.map((src) => `<img src="${src}" class="photo">`).join('');
      photosSection = `
        <div class="section">
          <div class="section-title">Photos</div>
          <div class="photos-grid">${photoItems}</div>
        </div>`;
    }

    let commentsSection = '';
    if (item.comments && item.comments.length > 0) {
      const sortedComments = [...item.comments].sort(
        (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
      );
      const commentItems = sortedComments
        .map((comment) => {
          const date = formatDateShort(comment.createdDate);
          const edited = comment.updatedDate ? ' <span class="edited">(edited)</span>' : '';
          const image = commentImages[comment.id]
            ? `<img src="${commentImages[comment.id]}" class="comment-image">`
            : '';
          return `
            <div class="comment">
              <div class="comment-date">${date}${edited}</div>
              <div class="comment-text">${this.escapeHtml(comment.text)}</div>
              ${image}
            </div>`;
        })
        .join('');
      commentsSection = `
        <div class="section">
          <div class="section-title">Comments</div>
          ${commentItems}
        </div>`;
    }

    let tagsSection = '';
    if (item.tags.length > 0) {
      const tagItems = item.tags
        .map((tag: string) => `<span class="tag">#${this.escapeHtml(tag)}</span>`)
        .join('');
      tagsSection = `<div class="tags-container">${tagItems}</div>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${this.escapeHtml(item.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
      color: #1d1d1f;
      line-height: 1.5;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 2px solid ${accentColor};
    }
    .emoji { font-size: 36px; }
    .title-container { flex: 1; }
    .type-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: white;
      background: ${accentColor};
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .title {
      font-size: 28px;
      font-weight: 600;
      color: #1d1d1f;
      line-height: 1.2;
    }
    .meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f7;
      border-radius: 12px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
    }
    .meta-icon { font-size: 18px; width: 28px; text-align: center; }
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #86868b;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e5e7;
    }
    .notes-content {
      font-size: 15px;
      color: #424245;
      white-space: pre-wrap;
    }
    .link-item {
      font-size: 14px;
      color: ${accentColor};
      margin-bottom: 6px;
      word-break: break-all;
    }
    .photos-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .photo {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
      object-fit: cover;
    }
    .comment {
      padding: 12px;
      background: #fafafa;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .comment-date {
      font-size: 12px;
      color: #86868b;
      margin-bottom: 4px;
    }
    .edited { font-style: italic; }
    .comment-text { font-size: 14px; }
    .comment-image {
      max-width: 150px;
      max-height: 150px;
      border-radius: 6px;
      margin-top: 8px;
    }
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }
    .tag {
      font-size: 13px;
      color: ${accentColor};
      background: ${accentColor}15;
      padding: 4px 12px;
      border-radius: 14px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e7;
      text-align: center;
      color: #86868b;
      font-size: 12px;
    }
    .timestamps {
      margin-bottom: 12px;
    }
    .dash-logo {
      font-weight: 600;
      font-size: 14px;
      color: #1d1d1f;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="emoji">${emoji}</span>
    <div class="title-container">
      <div class="type-badge">${typeLabel}</div>
      <h1 class="title">${this.escapeHtml(item.title)}</h1>
    </div>
  </div>
  
  ${
    dateSection || locationSection || prioritySection || recurrenceSection || statusSection
      ? `
  <div class="meta">
    ${statusSection}
    ${dateSection}
    ${locationSection}
    ${prioritySection}
    ${recurrenceSection}
  </div>`
      : ''
  }
  
  ${notesSection}
  ${linksSection}
  ${photosSection}
  ${commentsSection}
  ${tagsSection}
  
  <div class="footer">
    <div class="timestamps">
      Created: ${formatDateShort(item.createdDate)}
      ${item.updatedDate ? ` · Updated: ${formatDateShort(item.updatedDate)}` : ''}
    </div>
    <div class="dash-logo">Dash</div>
  </div>
</body>
</html>`;
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

  /**
   * Get a photo as base64 data URI
   */
  private async getPhotoAsBase64(photoPath: string): Promise<string | null> {
    try {
      const result = await Filesystem.readFile({
        path: photoPath,
        directory: Directory.Documents,
      });

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
    return (
      name
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) || 'dash-item'
    );
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const shareItemService = new ShareItemService();
