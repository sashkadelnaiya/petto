const CommentService = require('../services/commentService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')

module.exports = {
  async create(req, res, next) {
    try {
      const text = req.body.text?.trim()
      if (!text) throw new AppError('COMMENT_EMPTY', 400)

      const comment = await CommentService.create(
        req.user.id,
        req.params.id,
        text
      )
      success(res, comment, 201)
    } catch (e) {
      next(e)
    }
  },

  async getByPost(req, res, next) {
    try {
      const comments = await CommentService.getByPost(req.params.id)
      success(res, comments)
    } catch (e) {
      next(e)
    }
  },

  async delete(req, res, next) {
    try {
      await CommentService.delete(req.params.commentId, req.user.id)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },

  async edit(req, res, next) {
    try {
      const text = req.body.text?.trim()
      if (!text) throw new Error('Comment text cannot be empty')

      await CommentService.edit(req.params.commentId, req.user.id, text)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },
}
