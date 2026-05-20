const ChatService = require('../services/chatService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')
const { getIo } = require('../socket')
const db = require('../config/db')

module.exports = {
  async createOrGet(req, res, next) {
    try {
      const postId = req.params.postId
      const chat = await ChatService.getOrCreateChat(req.user.id, postId)
      success(res, chat)
    } catch (e) {
      next(e)
    }
  },

  async getUserChats(req, res, next) {
    try {
      const chats = await ChatService.getUserChats(req.user.id)
      success(res, chats)
    } catch (e) {
      next(e)
    }
  },

  async getMessages(req, res, next) {
    try {
      const messages = await ChatService.getMessages(
        req.params.chatId,
        req.user.id
      )
      success(res, messages)
    } catch (e) {
      next(e)
    }
  },

  async markMessagesAsRead(req, res, next) {
    try {
      await ChatService.markMessagesAsRead(req.params.chatId, req.user.id)
      const io = getIo()
      if (io) {
        io.to(`chat_${req.params.chatId}`).emit('messages_read', {
          chatId: Number(req.params.chatId),
          readerId: Number(req.user.id),
        })
      }
      success(res, { success: true })
    } catch (e) {
      next(e)
    }
  },

  async sendMessage(req, res, next) {
    try {
      const { text } = req.body
      const message = await ChatService.sendMessage(
        req.user.id,
        req.params.chatId,
        text
      )
      const io = getIo()
      if (io) {
        io.to(`chat_${req.params.chatId}`).emit('new_message', message)
      }
      success(res, message)
    } catch (e) {
      next(e)
    }
  },

  async deleteChatForUser(req, res, next) {
    try {
      await ChatService.deleteChatForUser(req.user.id, req.params.chatId)
      const io = getIo()
      if (io) {
        io.to(`chat_${req.params.chatId}`).emit('chat_deleted', {
          chatId: Number(req.params.chatId),
          deletedForUserId: Number(req.user.id),
        })
      }
      success(res, true)
    } catch (e) {
      next(e)
    }
  },

  async deleteMessage(req, res, next) {
    try {
      const messageMeta = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id, chat_id FROM messages WHERE id = ?`,
          [req.params.messageId],
          (err, row) => (err ? reject(err) : resolve(row || null))
        )
      })
      await ChatService.deleteMessage(req.user.id, req.params.messageId)
      const io = getIo()
      if (io && messageMeta?.chat_id) {
        io.to(`chat_${messageMeta.chat_id}`).emit('message_deleted', {
          messageId: Number(req.params.messageId),
          chatId: Number(messageMeta.chat_id),
        })
      }
      success(res, true)
    } catch (e) {
      next(e)
    }
  },

  async editMessage(req, res, next) {
    try {
      const newText = req.body.text?.trim()
      if (!newText) throw new Error('Message text cannot be empty')
      const messageMeta = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id, chat_id FROM messages WHERE id = ?`,
          [req.params.messageId],
          (err, row) => (err ? reject(err) : resolve(row || null))
        )
      })
      await ChatService.editMessage(req.user.id, req.params.messageId, newText)
      const io = getIo()
      if (io && messageMeta?.chat_id) {
        io.to(`chat_${messageMeta.chat_id}`).emit('message_updated', {
          messageId: Number(req.params.messageId),
          chatId: Number(messageMeta.chat_id),
          text: newText,
        })
      }
      success(res, true)
    } catch (e) {
      next(e)
    }
  },
}
