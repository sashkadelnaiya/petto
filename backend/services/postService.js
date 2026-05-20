const PostModel = require('../models/postModel')
const PostPhotoModel = require('../models/postPhotoModel')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async create(userId, data) {
    return await PostModel.create({
      ...data,
      author_id: userId,
    })
  },

  async getAll(filters, viewerUserId) {
    const posts = await PostModel.getAll(filters, viewerUserId)
    const postsWithPhotos = await Promise.all(
      posts.map(async (post) => {
        const photos = await PostPhotoModel.getByPost(post.id)
        return {
          ...post,
          photos: photos || [],
          is_favorited: Number(post.is_favorited) === 1,
        }
      }),
    )
    return postsWithPhotos
  },

  async getById(id) {
    const post = await PostModel.getById(id)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    const photos = await PostPhotoModel.getByPost(post.id)
    return {
      ...post,
      photos: photos || [],
    }
  },

  async getMyPosts(userId) {
    const posts = await PostModel.getByAuthor(userId)
    const postsWithPhotos = await Promise.all(
      posts.map(async (post) => {
        const photos = await PostPhotoModel.getByPost(post.id)
        return {
          ...post,
          photos: photos || [],
        }
      }),
    )
    return postsWithPhotos
  },

  async delete(postId, userId) {
    const result = await PostModel.delete(postId, userId)
    if (result.changes === 0) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }
    return true
  },

  async update(postId, userId, data) {
    const result = await PostModel.update(postId, userId, data)
    if (result.changes === 0) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }
    return true
  },
}
