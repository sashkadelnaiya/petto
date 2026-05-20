const db = require('./db')

function initTables() {
  db.serialize(() => {
    // USERS
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    // REFRESH_TOKENS
    db.run(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
    // POSTS
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id INTEGER NOT NULL,

        status TEXT CHECK(status IN ('lost', 'found')) NOT NULL,
        description TEXT DEFAULT NULL,

        event_date DATETIME NOT NULL,

        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,

        hashtag TEXT NOT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `)
    // POST_PHOTOS
    db.run(`
      CREATE TABLE IF NOT EXISTS post_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `)
    // FAVORITES
    db.run(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        PRIMARY KEY (user_id, post_id),
        
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id)
      )
    `)
    // COMMENTS
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL,
        
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `)
    // CHATS
    db.run(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user1_id, user2_id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user1_id) REFERENCES users(id),
        FOREIGN KEY (user2_id) REFERENCES users(id)
      )
    `)
    // CHAT_USERS
    db.run(`
      CREATE TABLE IF NOT EXISTS chat_users (
        chat_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        deleted INTEGER DEFAULT 0,
        PRIMARY KEY(chat_id, user_id),
        FOREIGN KEY(chat_id) REFERENCES chats(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `)
    // MESSAGES
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL,
        FOREIGN KEY(chat_id) REFERENCES chats(id),
        FOREIGN KEY(sender_id) REFERENCES users(id)
      )
    `)
    // MESSAGE_READS
    db.run(`
      CREATE TABLE IF NOT EXISTS message_reads (
        message_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(message_id, user_id),
        FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `)
  })
}

module.exports = initTables
