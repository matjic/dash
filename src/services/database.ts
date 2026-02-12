import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import type { DashItem } from '../models/DashItem';

const DB_NAME = 'dash.db';
const TABLE_NAME = 'dash_items';
const PREFERENCES_TABLE = 'user_preferences';

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
        comments TEXT,
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

    // Create preferences table
    const preferencesSchema = `
      CREATE TABLE IF NOT EXISTS ${PREFERENCES_TABLE} (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `;
    await this.db.execute(preferencesSchema);

    // Add comments column for existing databases (migration)
    try {
      await this.db.execute(`ALTER TABLE ${TABLE_NAME} ADD COLUMN comments TEXT`);
    } catch {
      // Column already exists, ignore
    }
  }

  async createItem(item: DashItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO ${TABLE_NAME} (
        id, title, notes, created_date, location, links, photo_paths, comments,
        item_type, is_completed, due_date, priority, tags, is_recurring,
        recurrence_rule, has_reminder, reminder_date, event_date, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      item.id,
      item.title,
      item.notes || null,
      item.createdDate,
      item.location || null,
      JSON.stringify(item.links),
      JSON.stringify(item.photoPaths),
      JSON.stringify(item.comments || []),
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
        title = ?, notes = ?, location = ?, links = ?, photo_paths = ?, comments = ?,
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
      JSON.stringify(item.comments || []),
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
      comments: JSON.parse(row.comments || '[]'),
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

  async getPreference(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query(
      `SELECT value FROM ${PREFERENCES_TABLE} WHERE key = ?`,
      [key]
    );

    if (!result.values || result.values.length === 0) {
      return null;
    }

    return result.values[0].value;
  }

  async setPreference(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      `INSERT OR REPLACE INTO ${PREFERENCES_TABLE} (key, value) VALUES (?, ?)`,
      [key, value]
    );
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection(DB_NAME, false);
      this.db = null;
      this.initialized = false;
    }
  }

  /**
   * Seed the database with sample data for screenshots.
   * Call this from the browser console: window.seedDemoData()
   */
  async seedDemoData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date();
    
    // Helper to create dates relative to today
    const daysFromNow = (days: number): string => {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      return date.toISOString();
    };

    const sampleItems: DashItem[] = [
      // Today's tasks
      {
        id: crypto.randomUUID(),
        title: 'Review quarterly report',
        notes: 'Check figures against last quarter projections',
        createdDate: daysFromNow(-2),
        location: '',
        links: ['https://docs.google.com/spreadsheets/d/quarterly-report'],
        photoPaths: [],
        comments: [
          {
            id: crypto.randomUUID(),
            text: 'Numbers look good, need to verify Q3 projections',
            createdDate: daysFromNow(-1),
          },
        ],
        itemType: 'task',
        isCompleted: false,
        dueDate: daysFromNow(0),
        priority: 'high',
        tags: ['work'],
        isRecurring: false,
        hasReminder: true,
        reminderDate: daysFromNow(0),
      },
      {
        id: crypto.randomUUID(),
        title: 'Call mom',
        notes: '',
        createdDate: daysFromNow(-1),
        location: '',
        links: [],
        photoPaths: [],
        comments: [],
        itemType: 'task',
        isCompleted: false,
        dueDate: daysFromNow(0),
        priority: 'medium',
        tags: ['personal'],
        isRecurring: true,
        recurrenceRule: 'weekly',
        hasReminder: false,
      },
      {
        id: crypto.randomUUID(),
        title: 'Pick up groceries',
        notes: 'Milk, eggs, bread, avocados',
        createdDate: daysFromNow(0),
        location: 'Whole Foods',
        links: [],
        photoPaths: [],
        comments: [],
        itemType: 'task',
        isCompleted: true,
        dueDate: daysFromNow(0),
        priority: 'low',
        tags: ['errands'],
        isRecurring: false,
        hasReminder: false,
      },
      // Upcoming tasks
      {
        id: crypto.randomUUID(),
        title: 'Dentist appointment',
        notes: 'Regular checkup',
        createdDate: daysFromNow(-5),
        location: 'Downtown Dental',
        links: [],
        photoPaths: [],
        comments: [],
        itemType: 'task',
        isCompleted: false,
        dueDate: daysFromNow(2),
        priority: 'medium',
        tags: ['health'],
        isRecurring: false,
        hasReminder: true,
        reminderDate: daysFromNow(1),
      },
      {
        id: crypto.randomUUID(),
        title: 'Submit expense report',
        notes: '',
        createdDate: daysFromNow(-3),
        location: '',
        links: ['https://expense.company.com/submit', 'https://docs.company.com/expense-policy'],
        photoPaths: [],
        comments: [],
        itemType: 'task',
        isCompleted: false,
        dueDate: daysFromNow(3),
        priority: 'high',
        tags: ['work', 'finance'],
        isRecurring: false,
        hasReminder: false,
      },
      {
        id: crypto.randomUUID(),
        title: 'Finish reading book',
        notes: 'Atomic Habits - last 3 chapters',
        createdDate: daysFromNow(-10),
        location: '',
        links: ['https://jamesclear.com/atomic-habits'],
        photoPaths: [],
        comments: [
          {
            id: crypto.randomUUID(),
            text: 'Chapter 15 has great insights on habit stacking',
            createdDate: daysFromNow(-5),
          },
          {
            id: crypto.randomUUID(),
            text: 'Remember to take notes on the 4 laws of behavior change',
            createdDate: daysFromNow(-3),
          },
        ],
        itemType: 'task',
        isCompleted: false,
        dueDate: daysFromNow(5),
        priority: 'low',
        tags: ['personal'],
        isRecurring: false,
        hasReminder: false,
      },
      {
        id: crypto.randomUUID(),
        title: 'Daily standup',
        notes: 'Quick sync with the team',
        createdDate: daysFromNow(-14),
        location: '',
        links: ['https://meet.google.com/abc-defg-hij'],
        photoPaths: [],
        comments: [],
        itemType: 'task',
        isCompleted: false,
        dueDate: daysFromNow(0),
        priority: 'medium',
        tags: ['work'],
        isRecurring: true,
        recurrenceRule: 'daily',
        hasReminder: true,
        reminderDate: daysFromNow(0),
      },
      {
        id: crypto.randomUUID(),
        title: 'Monthly budget review',
        notes: 'Review spending and update budget categories',
        createdDate: daysFromNow(-30),
        location: '',
        links: ['https://mint.com', 'https://docs.google.com/spreadsheets/d/budget-2026'],
        photoPaths: [],
        comments: [
          {
            id: crypto.randomUUID(),
            text: 'Need to allocate more for groceries this month',
            createdDate: daysFromNow(-2),
          },
        ],
        itemType: 'task',
        isCompleted: false,
        dueDate: daysFromNow(7),
        priority: 'medium',
        tags: ['finance', 'personal'],
        isRecurring: true,
        recurrenceRule: 'monthly',
        hasReminder: true,
        reminderDate: daysFromNow(6),
      },
      // Events
      {
        id: crypto.randomUUID(),
        title: 'Coffee with Sarah',
        notes: 'Catch up about the new project',
        createdDate: daysFromNow(-1),
        location: 'Blue Bottle Coffee',
        links: ['https://maps.google.com/?q=Blue+Bottle+Coffee'],
        photoPaths: [],
        comments: [
          {
            id: crypto.randomUUID(),
            text: 'Sarah mentioned she wants to discuss the marketing strategy',
            createdDate: daysFromNow(-1),
          },
        ],
        itemType: 'event',
        isCompleted: false,
        priority: 'none',
        tags: ['social'],
        isRecurring: false,
        hasReminder: true,
        reminderDate: daysFromNow(1),
        eventDate: daysFromNow(1),
      },
      {
        id: crypto.randomUUID(),
        title: 'Product launch meeting',
        notes: 'Q2 roadmap presentation',
        createdDate: daysFromNow(-4),
        location: 'Conference Room A',
        links: ['https://zoom.us/j/123456789', 'https://slides.google.com/d/q2-roadmap'],
        photoPaths: [],
        comments: [
          {
            id: crypto.randomUUID(),
            text: 'Confirmed with marketing team',
            createdDate: daysFromNow(-3),
          },
          {
            id: crypto.randomUUID(),
            text: 'Added slides link for remote attendees',
            createdDate: daysFromNow(-1),
          },
        ],
        itemType: 'event',
        isCompleted: false,
        priority: 'none',
        tags: ['work'],
        isRecurring: false,
        hasReminder: true,
        reminderDate: daysFromNow(3),
        eventDate: daysFromNow(4),
        endDate: daysFromNow(4),
      },
      {
        id: crypto.randomUUID(),
        title: 'Weekend hiking trip',
        notes: 'Pack sunscreen and snacks',
        createdDate: daysFromNow(-2),
        location: 'Mount Tam',
        links: ['https://alltrails.com/trail/mount-tam', 'https://weather.com/mount-tam'],
        photoPaths: [],
        comments: [],
        itemType: 'event',
        isCompleted: false,
        priority: 'none',
        tags: ['personal', 'outdoors'],
        isRecurring: false,
        hasReminder: false,
        eventDate: daysFromNow(6),
      },
      // Overdue task for visual variety
      {
        id: crypto.randomUUID(),
        title: 'Reply to client email',
        notes: 'Regarding contract renewal',
        createdDate: daysFromNow(-5),
        location: '',
        links: [],
        photoPaths: [],
        comments: [],
        itemType: 'task',
        isCompleted: false,
        dueDate: daysFromNow(-1),
        priority: 'high',
        tags: ['work'],
        isRecurring: false,
        hasReminder: false,
      },
    ];

    // Clear existing data
    await this.db.run(`DELETE FROM ${TABLE_NAME}`);

    // Insert sample items
    for (const item of sampleItems) {
      await this.createItem(item);
    }

    console.log(`Seeded ${sampleItems.length} demo items`);
  }
}

export const databaseService = new DatabaseService();

// Callback to refresh UI after seeding (set by useItems composable)
let onSeedComplete: (() => Promise<void>) | null = null;

export function setOnSeedComplete(callback: () => Promise<void>): void {
  onSeedComplete = callback;
}

// Expose seed function globally for easy access in simulator
if (typeof window !== 'undefined') {
  (window as any).seedDemoData = async () => {
    await databaseService.seedDemoData();
    if (onSeedComplete) {
      await onSeedComplete();
      console.log('UI refreshed');
    }
  };
}
