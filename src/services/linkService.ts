import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// URL pattern that matches http/https URLs
const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

export interface LinkSegment {
  type: 'text' | 'link';
  content: string;
  url?: string;
}

/**
 * Parse text and identify URLs, returning segments of text and links
 */
export function parseTextWithLinks(text: string): LinkSegment[] {
  if (!text) return [];

  const segments: LinkSegment[] = [];
  let lastIndex = 0;

  // Reset regex state
  URL_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = URL_PATTERN.exec(text)) !== null) {
    // Add text before link
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add link segment
    segments.push({
      type: 'link',
      content: match[0],
      url: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last link
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Check if text contains any URLs
 */
export function containsUrl(text: string): boolean {
  if (!text) return false;
  URL_PATTERN.lastIndex = 0;
  return URL_PATTERN.test(text);
}

/**
 * Extract all URLs from text
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  return text.match(URL_PATTERN) || [];
}

/**
 * Open URL in in-app browser (Safari View Controller on iOS)
 */
export async function openLink(url: string): Promise<void> {
  // Ensure URL has protocol
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  await Haptics.impact({ style: ImpactStyle.Light });

  await Browser.open({
    url: normalizedUrl,
    presentationStyle: 'popover',
  });
}
