const UserModel = require('../models/userModel')
const PostModel = require('../models/postModel')
const FavoriteModel = require('../models/favoriteModel')

module.exports = {
  async getProfile(userId) {
    const user = await UserModel.findById(userId)
    const myPosts = await PostModel.getByAuthor(userId)
    const favorites = await FavoriteModel.getUserFavorites(userId)

    return { user, myPosts, favorites }
  },

  async getUserById(userId) {
    const user = await UserModel.findById(userId)

    return { user }
  },

  async updateProfile(userId, data) {
    return await UserModel.updateProfile(userId, data)
  },

  async updateAvatar(userId, path) {
    return await UserModel.updateAvatar(userId, path)
  },

  async deleteAvatar(userId) {
    return await UserModel.deleteAvatar(userId)
  },

  async changePassword(userId, oldPassword, newPassword) {
    const isValid = await UserModel.verifyPassword(userId, oldPassword)
    if (!isValid) {
      const error = new Error('INVALID_PASSWORD')
      error.status = 400
      throw error
    }
    return await UserModel.changePassword(userId, newPassword)
  },
}
