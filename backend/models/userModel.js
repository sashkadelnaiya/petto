const db = require('../config/db')
const bcrypt = require('bcrypt')

module.exports = {
  findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  },

  create({ email, password, name }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (email, password, name) VALUES (?, ?, ?)`,
        [email, password, name],
        function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID, email, name })
        }
      )
    })
  },

  findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, email, name, avatar FROM users WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })
  },

  updateProfile(id, { name, email, password }) {
    return new Promise(async (resolve, reject) => {
      try {
        const fields = []
        const params = []

        if (name) {
          fields.push('name=?')
          params.push(name)
        }
        if (email) {
          fields.push('email=?')
          params.push(email)
        }
        if (password) {
          const hash = await bcrypt.hash(password, 10)
          fields.push('password=?')
          params.push(hash)
        }
        if (fields.length === 0) return resolve(await this.findById(id))

        params.push(id)
        db.run(
          `UPDATE users SET ${fields.join(', ')} WHERE id=?`,
          params,
          function (err) {
            if (err) reject(err)
            else resolve({ changes: this.changes })
          }
        )
      } catch (e) {
        reject(e)
      }
    })
  },

  updateAvatar(id, path) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET avatar=? WHERE id=?`,
        [path, id],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes, avatar: path })
        }
      )
    })
  },

  deleteAvatar(id) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET avatar=NULL WHERE id=?`,
        [id],
        function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        }
      )
    })
  },

  async verifyPassword(userId, password) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT password FROM users WHERE id = ?`,
        [userId],
        async (err, row) => {
          if (err) reject(err)
          else if (!row) resolve(false)
          else {
            const isValid = await bcrypt.compare(password, row.password)
            resolve(isValid)
          }
        }
      )
    })
  },

  changePassword(id, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        const hash = await bcrypt.hash(newPassword, 10)
        db.run(
          `UPDATE users SET password=? WHERE id=?`,
          [hash, id],
          function (err) {
            if (err) reject(err)
            else resolve({ changes: this.changes })
          }
        )
      } catch (e) {
        reject(e)
      }
    })
  },
}
