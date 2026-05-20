const db = require('../config/db')

module.exports = {
  async sendMessage(chat_id, sender_id, text) {
    text = text?.trim()
    if (!text) throw new Error('Message cannot be empty')
    if (text.length > 1000) throw new Error('Message is too long')

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)`,
        [chat_id, sender_id, text],
        function (err) {
          if (err) reject(err)
          else
            resolve({
              id: this.lastID,
              chat_id,
              sender_id,
              text,
              created_at: new Date(),
            })
        }
      )
    })
  },

  async getMessages(chat_id, user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          m.*,
          CASE
            WHEN m.sender_id = ? THEN
              CASE WHEN mr_other.user_id IS NOT NULL THEN 1 ELSE 0 END
            ELSE
              CASE WHEN mr_self.user_id IS NOT NULL THEN 1 ELSE 0 END
          END AS is_read
        FROM messages m
        JOIN chats c ON c.id = m.chat_id
        LEFT JOIN message_reads mr_self ON m.id = mr_self.message_id AND mr_self.user_id = ?
        LEFT JOIN message_reads mr_other
          ON m.id = mr_other.message_id
          AND mr_other.user_id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
        WHERE m.chat_id = ? 
        ORDER BY m.created_at ASC`,
        [user_id, user_id, user_id, chat_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      )
    })
  },

  async markMessagesAsRead(chat_id, user_id) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO message_reads (message_id, user_id)
         SELECT m.id, ?
         FROM messages m
         WHERE m.chat_id = ? 
           AND m.sender_id != ?
           AND NOT EXISTS (
             SELECT 1 FROM message_reads mr 
             WHERE mr.message_id = m.id AND mr.user_id = ?
           )`,
        [user_id, chat_id, user_id, user_id],
        function (err) {
          if (err) reject(err)
          else resolve({ count: this.changes })
        }
      )
    })
  },
}
