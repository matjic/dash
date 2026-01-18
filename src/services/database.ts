import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import type { DashItem } from '../models/DashItem';

const DB_NAME = 'dash.db';
const TABLE_NAME = 'dash_items';

class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private initialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if running on native platform
      const platform = Capacitor.getPlatform();
      
      if (platform === 'web') {
        // For web, we'll use jeep-sqlite web component
        await customElements.whenDefined('jeep-sqlite');
        const jeepSqliteEl = document.querySelector('jeep-sqlite');
        if (jeepSqliteEl) {
          await this.sqlite.initWebStore();
        }
      }

      // Create/open database
      this.db = await this.sqlite.createConnection(
        DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();
      await this.createTable();
      this.initialized = true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTable(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const schema = `
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        notes TEXT,
        created_date TEXT NOT NULL,
        location TEXT,
        links TEXT,
        photo_paths TEXT,
        item_type TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        due_date TEXT,
        priority TEXT DEFAULT 'none',
        tags TEXT,
        is_recurring INTEGER DEFAULT 0,
        recurrence_rule TEXT,
        has_reminder INTEGER DEFAULT 0,
        reminder_date TEXT,
        event_date TEXT,
        end_date TEXT
      );
    `;

    await this.db.execute(schema);
  }

  async createItem(item: DashItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO ${TABLE_NAME} (
        id, title, notes, created_date, location, links, photo_paths,
        item_type, is_completed, due_date, priority, tags, is_recurring,
        recurrence_rule, has_reminder, reminder_date, event_date, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      item.id,
      item.title,
      item.notes || null,
      item.createdDate,
      item.location || null,
      JSON.stringify(item.links),
      JSON.stringify(item.photoPaths),
      item.itemType,
      item.isCompleted ? 1 : 0,
      item.dueDate || null,
      item.priority,
      JSON.stringify(item.tags),
      item.isRecurring ? 1 : 0,
      item.recurrenceRule || null,
      item.hasReminder ? 1 : 0,
      item.reminderDate || null,
      item.eventDate || null,
      item.endDate || null,
    ];

    await this.db.run(query, values);
  }

  async getAllItems(): Promise<DashItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query(`SELECT * FROM ${TABLE_NAME}`);
    return (result.values || []).map(this.rowToItem);
  }

  async getItemById(id: string): Promise<DashItem | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );

    if (!result.values || result.values.length === 0) {
      return null;
    }

    return this.rowToItem(result.values[0]);
  }

  async updateItem(item: DashItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      UPDATE ${TABLE_NAME} SET
        title = ?, notes = ?, location = ?, links = ?, photo_paths = ?,
        item_type = ?, is_completed = ?, due_date = ?, priority = ?,
        tags = ?, is_recurring = ?, recurrence_rule = ?, has_reminder = ?,
        reminder_date = ?, event_date = ?, end_date = ?
      WHERE id = ?
    `;

    const values = [
      item.title,
      item.notes || null,
      item.location || null,
      JSON.stringify(item.links),
      JSON.stringify(item.photoPaths),
      item.itemType,
      item.isCompleted ? 1 : 0,
      item.dueDate || null,
      item.priority,
      JSON.stringify(item.tags),
      item.isRecurring ? 1 : 0,
      item.recurrenceRule || null,
      item.hasReminder ? 1 : 0,
      item.reminderDate || null,
      item.eventDate || null,
      item.endDate || null,
      item.id,
    ];

    await this.db.run(query, values);
  }

  async deleteItem(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
  }

  private rowToItem(row: any): DashItem {
    return {
      id: row.id,
      title: row.title,
      notes: row.notes || undefined,
      createdDate: row.created_date,
      location: row.location || undefined,
      links: JSON.parse(row.links || '[]'),
      photoPaths: JSON.parse(row.photo_paths || '[]'),
      itemType: row.item_type,
      isCompleted: row.is_completed === 1,
      dueDate: row.due_date || undefined,
      priority: row.priority,
      tags: JSON.parse(row.tags || '[]'),
      isRecurring: row.is_recurring === 1,
      recurrenceRule: row.recurrence_rule || undefined,
      hasReminder: row.has_reminder === 1,
      reminderDate: row.reminder_date || undefined,
      eventDate: row.event_date || undefined,
      endDate: row.end_date || undefined,
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection(DB_NAME, false);
      this.db = null;
      this.initialized = false;
    }
  }
}

export const databaseService = new DatabaseService();
