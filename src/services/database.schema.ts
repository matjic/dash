/**
 * Database Schema Definition
 *
 * This file defines the canonical schema for the dash_items table.
 * Both TypeScript and Swift database operations MUST stay in sync with this schema.
 *
 * When modifying:
 * 1. Update this file
 * 2. Update database.ts createTable()
 * 3. Update ios/App/App/DashDatabase.swift
 * 4. Run tests: bun run test
 */

export const DB_NAME = 'dash.db';
export const TABLE_NAME = 'dash_items';
export const PREFERENCES_TABLE = 'user_preferences';

/**
 * Column definitions for dash_items table
 * Used for validation tests between Swift and TypeScript
 */
export const DASH_ITEMS_COLUMNS = {
  id: { type: 'TEXT', nullable: false, primaryKey: true },
  title: { type: 'TEXT', nullable: false },
  notes: { type: 'TEXT', nullable: true },
  created_date: { type: 'TEXT', nullable: false },
  location: { type: 'TEXT', nullable: true },
  links: { type: 'TEXT', nullable: true, jsonArray: true },
  photo_paths: { type: 'TEXT', nullable: true, jsonArray: true },
  comments: { type: 'TEXT', nullable: true, jsonArray: true },
  attachments: { type: 'TEXT', nullable: true, jsonArray: true },
  is_completed: { type: 'INTEGER', nullable: false, default: 0 },
  due_date: { type: 'TEXT', nullable: true },
  priority: {
    type: 'TEXT',
    nullable: false,
    default: 'none',
    values: ['none', 'low', 'medium', 'high'],
  },
  tags: { type: 'TEXT', nullable: true, jsonArray: true },
  is_recurring: { type: 'INTEGER', nullable: false, default: 0 },
  recurrence_rule: { type: 'TEXT', nullable: true, values: ['daily', 'weekly', 'monthly'] },
  has_reminder: { type: 'INTEGER', nullable: false, default: 0 },
  reminder_date: { type: 'TEXT', nullable: true },
} as const;

export type ColumnName = keyof typeof DASH_ITEMS_COLUMNS;

/**
 * Get ordered list of column names (for INSERT statements)
 */
export const COLUMN_ORDER: ColumnName[] = [
  'id',
  'title',
  'notes',
  'created_date',
  'location',
  'links',
  'photo_paths',
  'comments',
  'attachments',
  'is_completed',
  'due_date',
  'priority',
  'tags',
  'is_recurring',
  'recurrence_rule',
  'has_reminder',
  'reminder_date',
];

/**
 * Default values for a new task created via Siri
 */
export const SIRI_TASK_DEFAULTS = {
  notes: null,
  location: null,
  links: '[]',
  photo_paths: '[]',
  comments: '[]',
  attachments: '[]',
  is_completed: 0,
  due_date: null,
  priority: 'none',
  tags: '[]',
  is_recurring: 0,
  recurrence_rule: null,
  has_reminder: 0,
  reminder_date: null,
} as const;
