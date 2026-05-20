const CommentModel = require('../models/commentModel')
const PostModel = require('../models/postModel')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async create(userId, postId, text) {
    if (!text?.trim()) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const post = await PostModel.getById(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }

    return await CommentModel.create({
      post_id: postId,
      author_id: userId,
      text,
    })
  },

  async getByPost(postId) {
    return await CommentModel.getByPost(postId)
  },

  async delete(commentId, userId) {
    const result = await CommentModel.delete(commentId, userId)
    if (result.changes === 0) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }
    return true
  },

  async edit(commentId, userId, text) {
    if (!text?.trim()) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const result = await CommentModel.update(commentId, userId, text)
    if (result.changes === 0) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }
    return true
  },
}
