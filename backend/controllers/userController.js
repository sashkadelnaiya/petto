const UserService = require('../services/userService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')

module.exports = {
  async getProfile(req, res, next) {
    try {
      const profile = await UserService.getProfile(req.user.id)
      success(res, profile)
    } catch (e) {
      next(e)
    }
  },

  async getUserById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.id)
      success(res, user)
    } catch (e) {
      next(e)
    }
  },

  async updateProfile(req, res, next) {
    try {
      const result = await UserService.updateProfile(req.user.id, req.body)
      success(res, result)
    } catch (e) {
      next(e)
    }
  },

  async updateAvatar(req, res, next) {
    try {
      if (!req.file) throw new AppError('NO_FILE_UPLOADED', 400)
      const path = `/uploads/avatars/${req.file.filename}`
      const result = await UserService.updateAvatar(req.user.id, path)
      success(res, result)
    } catch (e) {
      next(e)
    }
  },

  async deleteAvatar(req, res, next) {
    try {
      const result = await UserService.deleteAvatar(req.user.id)
      success(res, result)
    } catch (e) {
      next(e)
    }
  },

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body
      if (!oldPassword || !newPassword) {
        throw new AppError('MISSING_PASSWORD', 400)
      }
      const result = await UserService.changePassword(
        req.user.id,
        oldPassword,
        newPassword
      )
      success(res, result)
    } catch (e) {
      next(e)
    }
  },
}
