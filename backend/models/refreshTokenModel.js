const db = require('../config/db')

module.exports = {
  create({ user_id, token, expires_at }) {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
        `,
        [user_id, token, expires_at],
        function (err) {
          if (err) reject(err)
          else resolve(true)
        }
      )
    })
  },

  find(token) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM refresh_tokens WHERE token = ?`,
        [token],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })
  },

  delete(token) {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM refresh_tokens WHERE token = ?`,
        [token],
        function (err) {
          if (err) reject(err)
          else resolve(true)
        }
      )
    })
  },

  deleteByUser(user_id) {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM refresh_tokens WHERE user_id = ?`,
        [user_id],
        function (err) {
          if (err) reject(err)
          else resolve(true)
        }
      )
    })
  },
}
