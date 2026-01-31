const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'habits.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.run(`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    color TEXT DEFAULT '#4F46E5',
    target_days_per_week INTEGER DEFAULT 7,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(habit_id, date)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    content TEXT,
    reflection TEXT,
    mood TEXT DEFAULT 'neutral',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT 'User',
    title TEXT DEFAULT 'Habit Tracker',
    bio TEXT DEFAULT 'Striving for consistency.',
    avatar_url TEXT,
    gender TEXT DEFAULT 'Prefer not to say',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, [], (err) => {
    if (!err) {
      // Migration: Add gender column if it doesn't exist (for existing databases)
      db.run("ALTER TABLE user_profile ADD COLUMN gender TEXT DEFAULT 'Prefer not to say'", (alterErr) => {
        // Ignore error if column already exists
      });

      // Check if empty, if so insert default
      db.get("SELECT count(*) as count FROM user_profile", [], (err, row) => {
        if (row && row.count === 0) {
          db.run(`INSERT INTO user_profile (name, title, bio, gender) VALUES ('Alex Doe', 'High Performance Enthusiast', 'Building better habits one day at a time.', 'Prefer not to say')`);
        }
      });
    }
  });
}

module.exports = db;
