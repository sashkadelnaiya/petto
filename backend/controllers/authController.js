const AuthService = require('../services/authService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body)
      success(res, result, 201)
    } catch (e) {
      next(e)
    }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body)
      success(res, result)
    } catch (e) {
      next(e)
    }
  },

  async logout(req, res, next) {
    try {
      await AuthService.logout(req.body.refreshToken)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body
      const data = await AuthService.refresh(refreshToken)
      success(res, data)
    } catch (e) {
      next(e)
    }
  },
}
