const db = require('./db')

/** One-time script: populate chat_users for existing chats. Run via npm run migrate:chat-users */
function migrateChatUsers() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(
        `SELECT COUNT(*) as total_chats,
         (SELECT COUNT(DISTINCT chat_id) FROM chat_users) as migrated_chats
         FROM chats`,
        [],
        (err, stats) => {
          if (err) {
            console.error('Error checking migration status:', err)
            return reject(err)
          }

          if (stats.total_chats === 0 || stats.migrated_chats >= stats.total_chats) {
            if (stats.total_chats > 0) {
              console.log('Chat users migration: already up to date')
            }
            return resolve()
          }

          db.all('SELECT id, user1_id, user2_id FROM chats', [], (err, chats) => {
            if (err) {
              console.error('Error fetching chats:', err)
              return reject(err)
            }

            if (chats.length === 0) {
              console.log('No chats to migrate')
              return resolve()
            }

            console.log(`Found ${chats.length} chats to migrate`)

            let completed = 0
            let errors = 0

            chats.forEach((chat) => {
              const insertUser1 = new Promise((res, rej) => {
                db.run(
                  `INSERT OR IGNORE INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
                  [chat.id, chat.user1_id],
                  function (err) {
                    if (err) rej(err)
                    else res()
                  }
                )
              })

              const insertUser2 = new Promise((res, rej) => {
                db.run(
                  `INSERT OR IGNORE INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
                  [chat.id, chat.user2_id],
                  function (err) {
                    if (err) rej(err)
                    else res()
                  }
                )
              })

              Promise.all([insertUser1, insertUser2])
                .then(() => {
                  completed++
                  if (completed + errors === chats.length) {
                    console.log(`Migration completed: ${completed} chats migrated, ${errors} errors`)
                    resolve()
                  }
                })
                .catch((error) => {
                  console.error(`Error migrating chat ${chat.id}:`, error)
                  errors++
                  if (completed + errors === chats.length) {
                    console.log(`Migration completed: ${completed} chats migrated, ${errors} errors`)
                    resolve()
                  }
                })
            })
          })
        }
      )
    })
  })
}

if (require.main === module) {
  migrateChatUsers()
    .then(() => {
      console.log('Migration finished')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}

module.exports = migrateChatUsers
