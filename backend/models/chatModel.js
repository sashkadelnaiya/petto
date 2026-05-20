const db = require('../config/db')

module.exports = {
  async createChat(post_id, user1_id, user2_id) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO chats (post_id, user1_id, user2_id) VALUES (?, ?, ?)`,
        [post_id, user1_id, user2_id],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE'))
              return reject(new Error('Chat already exists'))
            return reject(err)
          }
          resolve({ id: this.lastID, post_id, user1_id, user2_id })
        }
      )
    })
  },

  async findChat(post_id, user1_id, user2_id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM chats WHERE post_id = ? AND ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))`,
        [post_id, user1_id, user2_id, user2_id, user1_id],
        (err, row) => (err ? reject(err) : resolve(row))
      )
    })
  },

  async findChatByUsers(user1_id, user2_id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM chats WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
         ORDER BY created_at DESC LIMIT 1`,
        [user1_id, user2_id, user2_id, user1_id],
        (err, row) => (err ? reject(err) : resolve(row))
      )
    })
  },

  async getUserChats(user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          c.*, 
          p.status, 
          p.address,
          CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS other_user_id,
          u.name AS other_user_name,
          u.avatar AS other_user_avatar,
          (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_text,
          (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_time,
          (SELECT sender_id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_sender_id,
          (SELECT COUNT(*) FROM messages m 
           WHERE m.chat_id = c.id 
             AND m.sender_id != ?
             AND NOT EXISTS (
               SELECT 1 FROM message_reads mr 
               WHERE mr.message_id = m.id AND mr.user_id = ?
             )
          ) AS unread_count,
          (SELECT 
             CASE 
               WHEN m.sender_id = ? THEN 
                 CASE WHEN mr.user_id IS NOT NULL THEN 1 ELSE 0 END
               ELSE 0
             END
           FROM messages m
           LEFT JOIN message_reads mr ON m.id = mr.message_id 
             AND mr.user_id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
           WHERE m.chat_id = c.id
           ORDER BY m.created_at DESC LIMIT 1
          ) AS last_message_read
        FROM chats c
        JOIN posts p ON p.id = c.post_id
        LEFT JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
        WHERE (c.user1_id = ? OR c.user2_id = ?)
          AND NOT EXISTS (
            SELECT 1 FROM chat_users cu 
            WHERE cu.chat_id = c.id 
            AND cu.user_id = ? 
            AND cu.deleted = 1
          )
        ORDER BY COALESCE(
          (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1),
          c.created_at
        ) DESC
        `,
        [user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      )
    })
  },
}
