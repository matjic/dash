import { describe, it, expect, vi } from 'vitest';
import { parseTextWithLinks, containsUrl, extractUrls, openLink } from './linkService';
import { mockBrowser, mockHaptics } from '../test/mocks/capacitor';

describe('linkService', () => {
  describe('parseTextWithLinks', () => {
    it('should return empty array for empty text', () => {
      expect(parseTextWithLinks('')).toEqual([]);
    });

    it('should return empty array for null/undefined input', () => {
      expect(parseTextWithLinks(null as unknown as string)).toEqual([]);
      expect(parseTextWithLinks(undefined as unknown as string)).toEqual([]);
    });

    it('should return text segment for plain text without URLs', () => {
      const result = parseTextWithLinks('This is plain text');

      expect(result).toEqual([{ type: 'text', content: 'This is plain text' }]);
    });

    it('should identify a single URL', () => {
      const result = parseTextWithLinks('Check https://example.com for details');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'text', content: 'Check ' });
      expect(result[1]).toEqual({
        type: 'link',
        content: 'https://example.com',
        url: 'https://example.com',
      });
      expect(result[2]).toEqual({ type: 'text', content: ' for details' });
    });

    it('should identify http URLs', () => {
      const result = parseTextWithLinks('Visit http://example.com');

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: 'link',
        content: 'http://example.com',
        url: 'http://example.com',
      });
    });

    it('should identify multiple URLs', () => {
      const result = parseTextWithLinks(
        'Check https://google.com and https://github.com'
      );

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ type: 'text', content: 'Check ' });
      expect(result[1]).toEqual({
        type: 'link',
        content: 'https://google.com',
        url: 'https://google.com',
      });
      expect(result[2]).toEqual({ type: 'text', content: ' and ' });
      expect(result[3]).toEqual({
        type: 'link',
        content: 'https://github.com',
        url: 'https://github.com',
      });
    });

    it('should handle URL at the start of text', () => {
      const result = parseTextWithLinks('https://start.com is the link');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: 'link',
        content: 'https://start.com',
        url: 'https://start.com',
      });
      expect(result[1]).toEqual({ type: 'text', content: ' is the link' });
    });

    it('should handle URL at the end of text', () => {
      const result = parseTextWithLinks('The link is https://end.com');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'text', content: 'The link is ' });
      expect(result[1]).toEqual({
        type: 'link',
        content: 'https://end.com',
        url: 'https://end.com',
      });
    });

    it('should handle URL only (no surrounding text)', () => {
      const result = parseTextWithLinks('https://only.com');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'link',
        content: 'https://only.com',
        url: 'https://only.com',
      });
    });

    it('should handle URLs with paths and query parameters', () => {
      const result = parseTextWithLinks(
        'Visit https://example.com/path/to/page?query=value&other=123'
      );

      expect(result[1]).toEqual({
        type: 'link',
        content: 'https://example.com/path/to/page?query=value&other=123',
        url: 'https://example.com/path/to/page?query=value&other=123',
      });
    });

    it('should handle URLs with fragments', () => {
      const result = parseTextWithLinks('See https://example.com/page#section');

      expect(result[1]).toEqual({
        type: 'link',
        content: 'https://example.com/page#section',
        url: 'https://example.com/page#section',
      });
    });

    it('should handle URLs with ports', () => {
      const result = parseTextWithLinks('Server at https://localhost:3000/api');

      expect(result[1]).toEqual({
        type: 'link',
        content: 'https://localhost:3000/api',
        url: 'https://localhost:3000/api',
      });
    });
  });

  describe('containsUrl', () => {
    it('should return false for empty text', () => {
      expect(containsUrl('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(containsUrl(null as unknown as string)).toBe(false);
      expect(containsUrl(undefined as unknown as string)).toBe(false);
    });

    it('should return false for plain text', () => {
      expect(containsUrl('This is plain text')).toBe(false);
    });

    it('should return true for text with https URL', () => {
      expect(containsUrl('Check https://example.com')).toBe(true);
    });

    it('should return true for text with http URL', () => {
      expect(containsUrl('Check http://example.com')).toBe(true);
    });

    it('should return false for email addresses', () => {
      // The regex only matches http/https URLs
      expect(containsUrl('Email me at test@example.com')).toBe(false);
    });

    it('should return false for partial URLs without protocol', () => {
      expect(containsUrl('Visit example.com')).toBe(false);
    });

    it('should return true for URL-only text', () => {
      expect(containsUrl('https://example.com')).toBe(true);
    });
  });

  describe('extractUrls', () => {
    it('should return empty array for empty text', () => {
      expect(extractUrls('')).toEqual([]);
    });

    it('should return empty array for null/undefined', () => {
      expect(extractUrls(null as unknown as string)).toEqual([]);
      expect(extractUrls(undefined as unknown as string)).toEqual([]);
    });

    it('should return empty array for text without URLs', () => {
      expect(extractUrls('This is plain text')).toEqual([]);
    });

    it('should extract single URL', () => {
      const result = extractUrls('Check https://example.com for details');

      expect(result).toEqual(['https://example.com']);
    });

    it('should extract multiple URLs', () => {
      const result = extractUrls(
        'Visit https://google.com and https://github.com and http://localhost:3000'
      );

      expect(result).toEqual([
        'https://google.com',
        'https://github.com',
        'http://localhost:3000',
      ]);
    });

    it('should extract URLs with paths and parameters', () => {
      const result = extractUrls(
        'API: https://api.example.com/v1/users?limit=10'
      );

      expect(result).toEqual(['https://api.example.com/v1/users?limit=10']);
    });
  });

  describe('openLink', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should open URL in browser with haptic feedback', async () => {
      await openLink('https://example.com');

      expect(mockHaptics.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
      expect(mockBrowser.open).toHaveBeenCalledWith({
        url: 'https://example.com',
        presentationStyle: 'popover',
      });
    });

    it('should add https protocol if missing', async () => {
      await openLink('example.com');

      expect(mockBrowser.open).toHaveBeenCalledWith({
        url: 'https://example.com',
        presentationStyle: 'popover',
      });
    });

    it('should not modify URL that already has http', async () => {
      await openLink('http://example.com');

      expect(mockBrowser.open).toHaveBeenCalledWith({
        url: 'http://example.com',
        presentationStyle: 'popover',
      });
    });

    it('should not modify URL that already has https', async () => {
      await openLink('https://secure.example.com');

      expect(mockBrowser.open).toHaveBeenCalledWith({
        url: 'https://secure.example.com',
        presentationStyle: 'popover',
      });
    });
  });
});
