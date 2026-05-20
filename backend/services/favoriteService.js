const FavoriteModel = require('../models/favoriteModel')
const PostModel = require('../models/postModel')
const PostPhotoModel = require('../models/postPhotoModel')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async add(userId, postId) {
    const post = await PostModel.getById(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }

    try {
      return await FavoriteModel.add(userId, postId)
    } catch (e) {
      if (e.message.includes('UNIQUE')) {
        throw new AppError(ERRORS.FAVORITE_ALREADY_EXISTS, 409)
      }
      throw e
    }
  },

  async remove(userId, postId) {
    const result = await FavoriteModel.remove(userId, postId)
    return result
  },

  async getMyFavorites(userId) {
    const posts = await FavoriteModel.getUserFavorites(userId)
    const postsWithPhotos = await Promise.all(
      posts.map(async (post) => {
        const photos = await PostPhotoModel.getByPost(post.id)
        return {
          ...post,
          photos: photos || [],
        }
      })
    )
    return postsWithPhotos
  },
}
