const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'lost_found.db');

const db = new sqlite3.Database(dbPath);


// =====================================================
// INITIALIZE DATABASE
// =====================================================

db.serialize(() => {

  // ===================================================
  // USERS
  // ===================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'lost_user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ===================================================
  // FOUND ITEMS
  // ===================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      finder_id INTEGER NOT NULL,

      category TEXT NOT NULL,
      color TEXT NOT NULL,
      location_found TEXT NOT NULL,
      date_found DATE NOT NULL,

      photo_url TEXT,

      -- SECRET
      -- NEVER expose this through public APIs
      secret_detail TEXT NOT NULL,

      status TEXT DEFAULT 'pending',

      rejection_reason TEXT,

      claimed_by INTEGER,

      verified_correct BOOLEAN DEFAULT FALSE,

      returned BOOLEAN DEFAULT FALSE,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (finder_id)
        REFERENCES users (id),

      FOREIGN KEY (claimed_by)
        REFERENCES users (id)
    )
  `);

  // Migration for databases created before manual claim resolution existed.
  // SQLite returns a duplicate-column error on later starts, which is safe.
  db.run('ALTER TABLE items ADD COLUMN manual_resolution BOOLEAN DEFAULT FALSE', () => {});


  // ===================================================
  // CLAIM ATTEMPTS
  // ===================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS claim_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      item_id INTEGER NOT NULL,

      user_id INTEGER NOT NULL,

      answer TEXT NOT NULL,

      attempt_count INTEGER DEFAULT 1,

      is_correct BOOLEAN,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (item_id)
        REFERENCES items (id),

      FOREIGN KEY (user_id)
        REFERENCES users (id)
    )
  `);


  // ===================================================
  // MESSAGES
  // ===================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      item_id INTEGER NOT NULL,

      sender_id INTEGER NOT NULL,

      receiver_id INTEGER NOT NULL,

      content TEXT NOT NULL,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (item_id)
        REFERENCES items (id),

      FOREIGN KEY (sender_id)
        REFERENCES users (id),

      FOREIGN KEY (receiver_id)
        REFERENCES users (id)
    )
  `);


  // ===================================================
  // DEFAULT ADMIN
  // ===================================================

  const adminPassword = bcrypt.hashSync('admin123', 10);

  db.run(
    `
    INSERT OR IGNORE INTO users
    (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
    `,
    [
      'admin',
      'admin@lostandfound.com',
      adminPassword,
      'admin'
    ],
    (err) => {

      if (err) {
        console.error(
          'Error creating admin:',
          err
        );
      }

    }
  );

});


module.exports = db;
