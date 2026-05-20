const ChatModel = require('../models/chatModel')
const MessageModel = require('../models/messageModel')
const db = require('../config/db')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async getOrCreateChat(userId, postId) {
    postId = Number(postId)
    if (!Number.isInteger(postId)) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const post = await new Promise((res, rej) =>
      db.get(`SELECT * FROM posts WHERE id = ?`, [postId], (err, row) =>
        err ? rej(err) : res(row)
      )
    )
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }

    const user1 = post.author_id
    const user2 = userId
    if (user1 === user2) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const existingChatByUsers = await ChatModel.findChatByUsers(user1, user2)
    if (existingChatByUsers) {
      await this.ensureChatUsersEntries(existingChatByUsers.id, user1, user2)
      return existingChatByUsers
    }

    const existingChat = await ChatModel.findChat(postId, user1, user2)
    if (existingChat) {
      await this.ensureChatUsersEntries(existingChat.id, user1, user2)
      return existingChat
    }

    const newChat = await ChatModel.createChat(postId, user1, user2)
    await this.ensureChatUsersEntries(newChat.id, user1, user2)
    return newChat
  },

  async ensureChatUsersEntries(chatId, user1, user2) {
    await new Promise((res, rej) => {
      db.run(
        `UPDATE chat_users SET deleted=0 WHERE chat_id=? AND user_id=?`,
        [chatId, user1],
        function (err) {
          if (err) {
            rej(err)
            return
          }
          if (this.changes === 0) {
            db.run(
              `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
              [chatId, user1],
              (insertErr) => (insertErr ? rej(insertErr) : res())
            )
          } else {
            res()
          }
        }
      )
    })
    await new Promise((res, rej) => {
      db.run(
        `UPDATE chat_users SET deleted=0 WHERE chat_id=? AND user_id=?`,
        [chatId, user2],
        function (err) {
          if (err) {
            rej(err)
            return
          }
          if (this.changes === 0) {
            db.run(
              `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
              [chatId, user2],
              (insertErr) => (insertErr ? rej(insertErr) : res())
            )
          } else {
            res()
          }
        }
      )
    })
  },

  async getUserChats(userId) {
    return await ChatModel.getUserChats(userId)
  },

  async sendMessage(senderId, chatId, text) {
    text = text?.trim()
    if (!text) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }
    if (text.length > 1000) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const chat = await new Promise((res, rej) =>
      db.get(
        `SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [chatId, senderId, senderId],
        (err, row) => (err ? rej(err) : res(row))
      )
    )
    if (!chat) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    const recipientId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id

    await new Promise((res, rej) => {
      db.run(
        `UPDATE chat_users SET deleted=0 WHERE chat_id=? AND user_id=?`,
        [chatId, recipientId],
        function (err) {
          if (err) {
            rej(err)
            return
          }
          if (this.changes === 0) {
            db.run(
              `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
              [chatId, recipientId],
              (insertErr) => (insertErr ? rej(insertErr) : res())
            )
          } else {
            res()
          }
        }
      )
    })

    await new Promise((res, rej) => {
      db.run(
        `UPDATE chat_users SET deleted=0 WHERE chat_id=? AND user_id=?`,
        [chatId, senderId],
        function (err) {
          if (err) {
            rej(err)
            return
          }
          if (this.changes === 0) {
            db.run(
              `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 0)`,
              [chatId, senderId],
              (insertErr) => (insertErr ? rej(insertErr) : res())
            )
          } else {
            res()
          }
        }
      )
    })

    return await MessageModel.sendMessage(chatId, senderId, text)
  },

  async getMessages(chatId, userId) {
    const chat = await new Promise((res, rej) =>
      db.get(
        `SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [chatId, userId, userId],
        (err, row) => (err ? rej(err) : res(row))
      )
    )
    if (!chat) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    return await MessageModel.getMessages(chatId, userId)
  },

  async markMessagesAsRead(chatId, userId) {
    const chat = await new Promise((res, rej) =>
      db.get(
        `SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [chatId, userId, userId],
        (err, row) => (err ? rej(err) : res(row))
      )
    )
    if (!chat) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    return await MessageModel.markMessagesAsRead(chatId, userId)
  },

  async deleteChatForUser(userId, chatId) {
    await new Promise((res, rej) => {
      db.run(
        `UPDATE chat_users SET deleted=1 WHERE chat_id=? AND user_id=?`,
        [chatId, userId],
        function (err) {
          if (err) {
            rej(err)
            return
          }
          if (this.changes === 0) {
            db.run(
              `INSERT INTO chat_users (chat_id, user_id, deleted) VALUES (?, ?, 1)`,
              [chatId, userId],
              function (insertErr) {
                if (insertErr) {
                  db.run(
                    `UPDATE chat_users SET deleted=1 WHERE chat_id=? AND user_id=?`,
                    [chatId, userId],
                    (updateErr) => (updateErr ? rej(updateErr) : res())
                  )
                } else {
                  res()
                }
              }
            )
          } else {
            res()
          }
        }
      )
    })
  },

  async deleteMessage(userId, messageId) {
    const message = await new Promise((res, rej) =>
      db.get(`SELECT * FROM messages WHERE id=?`, [messageId], (err, row) =>
        err ? rej(err) : res(row)
      )
    )
    if (!message) {
      throw new AppError(ERRORS.INVALID_INPUT, 404)
    }

    if (message.sender_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    await new Promise((res, rej) =>
      db.run(`DELETE FROM messages WHERE id=?`, [messageId], function (err) {
        if (err) rej(err)
        else res()
      })
    )

    const count = await new Promise((res, rej) =>
      db.get(
        `SELECT COUNT(*) as cnt FROM messages WHERE chat_id=?`,
        [message.chat_id],
        (err, row) => (err ? rej(err) : res(row.cnt))
      )
    )

    if (count === 0) {
      await new Promise((res, rej) =>
        db.run(`DELETE FROM chats WHERE id=?`, [message.chat_id], (err) =>
          err ? rej(err) : res()
        )
      )
    }
  },

  async editMessage(userId, messageId, newText) {
    newText = newText?.trim()
    if (!newText) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }
    if (newText.length > 1000) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const message = await new Promise((res, rej) =>
      db.get(`SELECT * FROM messages WHERE id=?`, [messageId], (err, row) =>
        err ? rej(err) : res(row)
      )
    )
    if (!message) {
      throw new AppError(ERRORS.INVALID_INPUT, 404)
    }
    if (message.sender_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    await new Promise((res, rej) =>
      db.run(
        `UPDATE messages SET text=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [newText, messageId],
        function (err) {
          if (err) rej(err)
          else res()
        }
      )
    )
  },
}
