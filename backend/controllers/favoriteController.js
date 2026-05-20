const FavoriteService = require('../services/favoriteService')
const { success } = require('../utils/response')

module.exports = {
  async add(req, res, next) {
    try {
      await FavoriteService.add(req.user.id, req.params.id)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },

  async remove(req, res, next) {
    try {
      await FavoriteService.remove(req.user.id, req.params.id)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },

  async myFavorites(req, res, next) {
    try {
      const posts = await FavoriteService.getMyFavorites(req.user.id)
      success(res, posts)
    } catch (e) {
      next(e)
    }
  },
}
