const PostService = require('../services/postService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')

module.exports = {
  async create(req, res, next) {
    try {
      const data = req.body

      if (!data.status?.trim()) throw new AppError('STATUS_REQUIRED', 400)
      if (!data.event_date?.trim())
        throw new AppError('EVENT_DATE_REQUIRED', 400)
      if (!data.address?.trim()) throw new AppError('ADDRESS_REQUIRED', 400)
      if (!data.hashtag?.trim()) throw new AppError('HASHTAG_REQUIRED', 400)

      if (data.latitude && isNaN(Number(data.latitude)))
        throw new AppError('INVALID_LATITUDE', 400)
      if (data.longitude && isNaN(Number(data.longitude)))
        throw new AppError('INVALID_LONGITUDE', 400)

      const post = await PostService.create(req.user.id, data)
      success(res, post, 201)
    } catch (e) {
      next(e)
    }
  },

  async getAll(req, res, next) {
    try {
      const rawId = req.user?.id
      const viewerId =
        rawId !== undefined && rawId !== null ? Number(rawId) : null
      const posts = await PostService.getAll(
        req.query,
        Number.isFinite(viewerId) ? viewerId : null,
      )
      success(res, posts)
    } catch (e) {
      next(e)
    }
  },

  async getById(req, res, next) {
    try {
      const post = await PostService.getById(req.params.id)
      success(res, post)
    } catch (e) {
      next(e)
    }
  },

  async getMyPosts(req, res, next) {
    try {
      const posts = await PostService.getMyPosts(req.user.id)
      success(res, posts)
    } catch (e) {
      next(e)
    }
  },

  async delete(req, res, next) {
    try {
      await PostService.delete(req.params.id, req.user.id)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },

  async update(req, res, next) {
    try {
      const data = req.body

      if (data.status !== undefined && !data.status?.trim())
        throw new AppError('STATUS_EMPTY', 400)
      if (data.event_date !== undefined && !data.event_date?.trim())
        throw new AppError('EVENT_DATE_EMPTY', 400)
      if (data.address !== undefined && !data.address?.trim())
        throw new AppError('ADDRESS_EMPTY', 400)
      if (data.hashtag !== undefined && !data.hashtag?.trim())
        throw new AppError('HASHTAG_EMPTY', 400)
      if (data.latitude !== undefined && isNaN(Number(data.latitude)))
        throw new AppError('INVALID_LATITUDE', 400)
      if (data.longitude !== undefined && isNaN(Number(data.longitude)))
        throw new AppError('INVALID_LONGITUDE', 400)

      await PostService.update(req.params.id, req.user.id, data)
      success(res, true)
    } catch (e) {
      next(e)
    }
  },
}
