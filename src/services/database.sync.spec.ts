/**
 * Database Sync Tests
 *
 * These tests ensure that the Swift (DashDatabase.swift) and TypeScript (database.ts)
 * database operations stay in sync. This is critical for Siri integration where
 * Swift creates items that TypeScript reads.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  DASH_ITEMS_COLUMNS,
  COLUMN_ORDER,
  SIRI_TASK_DEFAULTS,
  DB_NAME,
  TABLE_NAME,
} from './database.schema';

// Read the Swift and TypeScript source files
const SWIFT_DB_PATH = path.join(__dirname, '../../ios/App/App/DashDatabase.swift');
const TS_DB_PATH = path.join(__dirname, './database.ts');

describe('Database Schema Sync', () => {
  describe('Schema Definition', () => {
    it('should have all required columns defined', () => {
      const requiredColumns = [
        'id',
        'title',
        'created_date',
        'is_completed',
        'priority',
        'is_recurring',
        'has_reminder',
      ];

      for (const col of requiredColumns) {
        expect(DASH_ITEMS_COLUMNS).toHaveProperty(col);
      }
    });

    it('should have correct column order for INSERT statements', () => {
      expect(COLUMN_ORDER).toHaveLength(Object.keys(DASH_ITEMS_COLUMNS).length);

      for (const col of COLUMN_ORDER) {
        expect(DASH_ITEMS_COLUMNS).toHaveProperty(col);
      }
    });

    it('should have valid JSON array columns', () => {
      const jsonColumns = Object.entries(DASH_ITEMS_COLUMNS)
        .filter(([_, def]) => 'jsonArray' in def && def.jsonArray)
        .map(([name]) => name);

      expect(jsonColumns).toContain('links');
      expect(jsonColumns).toContain('photo_paths');
      expect(jsonColumns).toContain('comments');
      expect(jsonColumns).toContain('tags');
    });
  });

  describe('Swift Database File', () => {
    let swiftContent: string;

    beforeAll(() => {
      swiftContent = fs.readFileSync(SWIFT_DB_PATH, 'utf-8');
    });

    it('should exist', () => {
      expect(fs.existsSync(SWIFT_DB_PATH)).toBe(true);
    });

    it('should use correct database name', () => {
      expect(swiftContent).toContain(`"${DB_NAME}"`);
    });

    it('should use correct table name', () => {
      expect(swiftContent).toContain(TABLE_NAME);
    });

    it('should have INSERT with all columns in correct order', () => {
      // Check that Swift INSERT matches our column order
      const insertMatch = swiftContent.match(/INSERT INTO dash_items \(([\s\S]*?)\) VALUES/);
      expect(insertMatch).not.toBeNull();

      if (insertMatch) {
        const columnsInInsert = insertMatch[1]
          .replace(/\s+/g, ' ')
          .split(',')
          .map((c) => c.trim());

        expect(columnsInInsert).toEqual(COLUMN_ORDER);
      }
    });

    it('should bind correct number of parameters for task', () => {
      // Count unique parameter positions in createTask
      const taskSection = swiftContent.match(/func createTask[\s\S]*?(?=func |$)/);
      if (taskSection) {
        // Find all unique parameter indices
        const paramIndices = new Set<number>();
        const matches = taskSection[0].matchAll(/sqlite3_bind_\w+\(statement,\s*(\d+)/g);
        for (const match of matches) {
          paramIndices.add(parseInt(match[1]));
        }
        expect(paramIndices.size).toBe(COLUMN_ORDER.length);
      }
    });

    it('should use correct default priority', () => {
      expect(swiftContent).toContain('"none"');
    });

    it('should serialize arrays as JSON', () => {
      // Swift should use "[]" for empty arrays
      expect(swiftContent).toContain('"[]"');
    });
  });

  describe('TypeScript Database File', () => {
    let tsContent: string;

    beforeAll(() => {
      tsContent = fs.readFileSync(TS_DB_PATH, 'utf-8');
    });

    it('should exist', () => {
      expect(fs.existsSync(TS_DB_PATH)).toBe(true);
    });

    it('should use correct database name', () => {
      const hasDbName = tsContent.includes(`'${DB_NAME}'`) || tsContent.includes(`"${DB_NAME}"`);
      expect(hasDbName).toBe(true);
    });

    it('should use correct table name', () => {
      expect(tsContent).toContain(TABLE_NAME);
    });

    it('should have CREATE TABLE with all columns', () => {
      for (const col of COLUMN_ORDER) {
        expect(tsContent).toContain(col);
      }
    });

    it('should serialize arrays as JSON in createItem', () => {
      expect(tsContent).toContain('JSON.stringify(item.links)');
      expect(tsContent).toContain('JSON.stringify(item.photoPaths)');
      expect(tsContent).toContain('JSON.stringify(item.tags)');
      expect(tsContent).toContain('JSON.stringify(item.comments');
    });

    it('should parse JSON arrays in rowToItem', () => {
      expect(tsContent).toContain("JSON.parse(row.links || '[]')");
      expect(tsContent).toContain("JSON.parse(row.photo_paths || '[]')");
      expect(tsContent).toContain("JSON.parse(row.tags || '[]')");
      expect(tsContent).toContain("JSON.parse(row.comments || '[]')");
    });
  });

  describe('Siri Defaults', () => {
    it('should have empty JSON arrays as strings', () => {
      expect(SIRI_TASK_DEFAULTS.links).toBe('[]');
      expect(SIRI_TASK_DEFAULTS.photo_paths).toBe('[]');
      expect(SIRI_TASK_DEFAULTS.comments).toBe('[]');
      expect(SIRI_TASK_DEFAULTS.tags).toBe('[]');
    });

    it('should have default priority as none', () => {
      expect(SIRI_TASK_DEFAULTS.priority).toBe('none');
    });

    it('should have boolean fields as 0', () => {
      expect(SIRI_TASK_DEFAULTS.is_completed).toBe(0);
      expect(SIRI_TASK_DEFAULTS.is_recurring).toBe(0);
      expect(SIRI_TASK_DEFAULTS.has_reminder).toBe(0);
    });
  });

  describe('Column Mapping Consistency', () => {
    let swiftContent: string;
    let tsContent: string;

    beforeAll(() => {
      swiftContent = fs.readFileSync(SWIFT_DB_PATH, 'utf-8');
      tsContent = fs.readFileSync(TS_DB_PATH, 'utf-8');
    });

    it('should map is_completed to isCompleted in TypeScript', () => {
      expect(tsContent).toContain('is_completed');
      expect(tsContent).toContain('isCompleted');
      expect(tsContent).toMatch(/is_completed.*===.*1/); // Check boolean conversion
    });

    it('should map created_date to createdDate in TypeScript', () => {
      expect(tsContent).toContain('created_date');
      expect(tsContent).toContain('createdDate');
    });

    it('should map photo_paths to photoPaths in TypeScript', () => {
      expect(tsContent).toContain('photo_paths');
      expect(tsContent).toContain('photoPaths');
    });

    it('Swift and TypeScript should handle ISO8601 dates', () => {
      expect(swiftContent).toContain('ISO8601DateFormatter');
      expect(tsContent).toContain('toISOString');
    });
  });
});

describe('Data Format Compatibility', () => {
  it('should create valid JSON for empty arrays', () => {
    const emptyArray = JSON.stringify([]);
    expect(emptyArray).toBe('[]');
  });

  it('should handle ISO8601 date format', () => {
    const date = new Date('2024-01-15T10:30:00.000Z');
    const iso = date.toISOString();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should handle UUID format', () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
