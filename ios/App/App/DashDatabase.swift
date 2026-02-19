import Foundation

// SQLite3 C library types and functions
// These are available through libsqlite3.tbd which is linked via the Capacitor SQLite plugin

typealias SQLiteDB = OpaquePointer
typealias SQLiteStatement = OpaquePointer

// SQLite constants
let SQLITE_OK: Int32 = 0
let SQLITE_DONE: Int32 = 101
let SQLITE_ROW: Int32 = 100

// Import SQLite3 C functions
@_silgen_name("sqlite3_open")
func sqlite3_open(_ filename: UnsafePointer<CChar>?, _ ppDb: UnsafeMutablePointer<SQLiteDB?>?) -> Int32

@_silgen_name("sqlite3_close")
func sqlite3_close(_ db: SQLiteDB?) -> Int32

@_silgen_name("sqlite3_prepare_v2")
func sqlite3_prepare_v2(_ db: SQLiteDB?, _ zSql: UnsafePointer<CChar>?, _ nByte: Int32, _ ppStmt: UnsafeMutablePointer<SQLiteStatement?>?, _ pzTail: UnsafeMutablePointer<UnsafePointer<CChar>?>?) -> Int32

@_silgen_name("sqlite3_step")
func sqlite3_step(_ stmt: SQLiteStatement?) -> Int32

@_silgen_name("sqlite3_finalize")
func sqlite3_finalize(_ stmt: SQLiteStatement?) -> Int32

@_silgen_name("sqlite3_bind_text")
func sqlite3_bind_text(_ stmt: SQLiteStatement?, _ index: Int32, _ value: UnsafePointer<CChar>?, _ length: Int32, _ destructor: (@convention(c) (UnsafeMutableRawPointer?) -> Void)?) -> Int32

@_silgen_name("sqlite3_bind_int")
func sqlite3_bind_int(_ stmt: SQLiteStatement?, _ index: Int32, _ value: Int32) -> Int32

@_silgen_name("sqlite3_bind_null")
func sqlite3_bind_null(_ stmt: SQLiteStatement?, _ index: Int32) -> Int32

/// Handles direct database access for Siri intents
/// This allows creating tasks without opening the app
class DashDatabase {
    static let shared = DashDatabase()
    
    private let dbName = "dash.db"
    private var db: SQLiteDB?
    
    private init() {}
    
    /// Get the path to the database in the app's documents directory
    private func getDatabasePath() -> String? {
        // The Capacitor SQLite plugin stores the database in the Documents directory
        guard let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return nil
        }
        return documentsPath.appendingPathComponent(dbName).path
    }
    
    /// Open connection to the database
    private func openDatabase() -> Bool {
        guard let dbPath = getDatabasePath() else {
            print("DashDatabase: Could not get database path")
            return false
        }
        
        // Check if database file exists
        if !FileManager.default.fileExists(atPath: dbPath) {
            print("DashDatabase: Database file does not exist at \(dbPath)")
            return false
        }
        
        if sqlite3_open(dbPath, &db) == SQLITE_OK {
            print("DashDatabase: Successfully opened database")
            return true
        } else {
            print("DashDatabase: Failed to open database")
            return false
        }
    }
    
    /// Close the database connection
    private func closeDatabase() {
        if db != nil {
            _ = sqlite3_close(db)
            db = nil
        }
    }
    
    /// Create a new task in the database
    func createTask(title: String, dueDate: Date? = nil, priority: String = "none") -> Bool {
        guard openDatabase() else { return false }
        defer { closeDatabase() }
        
        let id = UUID().uuidString
        let createdDate = ISO8601DateFormatter().string(from: Date())
        let dueDateStr = dueDate.map { ISO8601DateFormatter().string(from: $0) }
        
        let query = """
            INSERT INTO dash_items (
                id, title, notes, created_date, location, links, photo_paths, comments,
                is_completed, due_date, priority, tags, is_recurring,
                recurrence_rule, has_reminder, reminder_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        var statement: SQLiteStatement?
        
        guard sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK else {
            print("DashDatabase: Failed to prepare statement")
            return false
        }
        
        defer { _ = sqlite3_finalize(statement) }
        
        // Bind parameters
        _ = sqlite3_bind_text(statement, 1, id, -1, nil)                    // id
        _ = sqlite3_bind_text(statement, 2, title, -1, nil)                 // title
        _ = sqlite3_bind_null(statement, 3)                                 // notes
        _ = sqlite3_bind_text(statement, 4, createdDate, -1, nil)          // created_date
        _ = sqlite3_bind_null(statement, 5)                                 // location
        _ = sqlite3_bind_text(statement, 6, "[]", -1, nil)                 // links (JSON)
        _ = sqlite3_bind_text(statement, 7, "[]", -1, nil)                 // photo_paths (JSON)
        _ = sqlite3_bind_text(statement, 8, "[]", -1, nil)                 // comments (JSON)
        _ = sqlite3_bind_int(statement, 9, 0)                              // is_completed
        if let dueDateStr = dueDateStr {
            _ = sqlite3_bind_text(statement, 10, dueDateStr, -1, nil)      // due_date
        } else {
            _ = sqlite3_bind_null(statement, 10)
        }
        _ = sqlite3_bind_text(statement, 11, priority, -1, nil)            // priority
        _ = sqlite3_bind_text(statement, 12, "[]", -1, nil)                // tags (JSON)
        _ = sqlite3_bind_int(statement, 13, 0)                             // is_recurring
        _ = sqlite3_bind_null(statement, 14)                               // recurrence_rule
        _ = sqlite3_bind_int(statement, 15, 0)                             // has_reminder
        _ = sqlite3_bind_null(statement, 16)                               // reminder_date
        
        if sqlite3_step(statement) == SQLITE_DONE {
            print("DashDatabase: Successfully created task '\(title)'")
            return true
        } else {
            print("DashDatabase: Failed to insert task")
            return false
        }
    }
    
    /// Check if the database exists and is accessible
    func isDatabaseAvailable() -> Bool {
        guard let dbPath = getDatabasePath() else { return false }
        return FileManager.default.fileExists(atPath: dbPath)
    }
}
