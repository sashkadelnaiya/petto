const db = require('../config/db')

module.exports = {
  add(user_id, post_id) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO favorites (user_id, post_id) VALUES (?, ?)`,
        [user_id, post_id],
        function (err) {
          if (err) reject(err)
          else resolve(true)
        }
      )
    })
  },

  remove(user_id, post_id) {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM favorites WHERE user_id = ? AND post_id = ?`,
        [user_id, post_id],
        function (err) {
          if (err) reject(err)
          else resolve(true)
        }
      )
    })
  },

  getUserFavorites(user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT p.*, u.name as author_name, u.avatar as author_avatar, COUNT(c.id) as comments_count
        FROM posts p
        JOIN favorites f ON f.post_id = p.id
        JOIN users u ON u.id = p.author_id
        LEFT JOIN comments c ON c.post_id = p.id
        WHERE f.user_id = ?
        GROUP BY p.id
        ORDER BY f.created_at DESC
        `,
        [user_id],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })
  },
}
