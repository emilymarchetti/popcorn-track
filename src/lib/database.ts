import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
let isInitialized = false;

// Initialize SQLite database
export const initDatabase = async (): Promise<Database> => {
  if (db && isInitialized) {
    return db;
  }

  try {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem('popcorn_track_db');
    if (savedDb) {
      const uint8Array = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(uint8Array);
    } else {
      db = new SQL.Database();
    }

    // Create tables if they don't exist
    await createTables(db);
    isInitialized = true;

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Create database tables
const createTables = async (database: Database) => {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      login TEXT NOT NULL,
      avatar_url TEXT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Settings table - Global settings (no user_id)
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Movies table (cache TMDB data)
    `CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      release_date TEXT,
      vote_average REAL,
      genre_ids TEXT, -- JSON array
      genres TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // TV Shows table (cache TMDB data)
    `CREATE TABLE IF NOT EXISTS tv_shows (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      overview TEXT,
      poster_path TEXT,
      backdrop_path TEXT,
      first_air_date TEXT,
      vote_average REAL,
      genre_ids TEXT, -- JSON array
      genres TEXT, -- JSON array
      number_of_seasons INTEGER,
      number_of_episodes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Watched Movies table
    `CREATE TABLE IF NOT EXISTS watched_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      movie_id INTEGER NOT NULL,
      rating INTEGER DEFAULT 0,
      watched_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (movie_id) REFERENCES movies (id),
      UNIQUE(user_id, movie_id)
    )`,

    // Watched TV Shows table
    `CREATE TABLE IF NOT EXISTS watched_shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      show_id INTEGER NOT NULL,
      rating INTEGER DEFAULT 0,
      status TEXT DEFAULT 'watching', -- watching, completed, dropped
      watched_episodes TEXT, -- JSON array of episode numbers
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (show_id) REFERENCES tv_shows (id),
      UNIQUE(user_id, show_id)
    )`,

    // Watchlist table
    `CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL, -- 'movie' or 'tv'
      item_id INTEGER NOT NULL,
      added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      priority INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, item_type, item_id)
    )`
  ];

  tables.forEach(sql => {
    database.exec(sql);
  });

  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_watched_movies_user ON watched_movies(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_watched_shows_user ON watched_shows(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)'
  ];

  indexes.forEach(sql => {
    database.exec(sql);
  });
};

// Save database to localStorage
export const saveDatabase = async () => {
  if (!db) return;
  
  try {
    const data = db.export();
    const buffer = Array.from(data);
    localStorage.setItem('popcorn_track_db', JSON.stringify(buffer));
  } catch (error) {
    console.error('Failed to save database:', error);
  }
};

// Execute a query and return results
export const executeQuery = async (sql: string, params: any[] = []): Promise<any[]> => {
  if (!db) {
    await initDatabase();
  }
  
  try {
    const stmt = db!.prepare(sql);
    const results: any[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    
    stmt.free();
    await saveDatabase();
    
    return results;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
};

// Execute a query without returning results (INSERT, UPDATE, DELETE)
export const executeNonQuery = async (sql: string, params: any[] = []): Promise<void> => {
  if (!db) {
    await initDatabase();
  }
  
  try {
    const stmt = db!.prepare(sql);
    stmt.run(params);
    stmt.free();
    await saveDatabase();
  } catch (error) {
    console.error('Non-query execution failed:', error);
    throw error;
  }
};

// Get database instance
export const getDatabase = async (): Promise<Database> => {
  if (!db) {
    await initDatabase();
  }
  return db!;
};

// Clear all data
export const clearDatabase = async () => {
  if (!db) return;
  
  const tables = [
    'watched_movies',
    'watched_shows', 
    'watchlist',
    'settings',
    'movies',
    'tv_shows',
    'users'
  ];
  
  tables.forEach(table => {
    db!.exec(`DELETE FROM ${table}`);
  });
  
  await saveDatabase();
};