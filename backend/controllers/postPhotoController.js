const PostPhotoService = require('../services/postPhotoService')
const { success } = require('../utils/response')
const AppError = require('../utils/AppError')

module.exports = {
  async upload(req, res, next) {
    try {
      const result = await PostPhotoService.upload(
        req.params.id,
        req.user.id,
        req.files
      )
      success(res, result, 201)
    } catch (e) {
      next(e)
    }
  },

  async get(req, res, next) {
    try {
      const photos = await PostPhotoService.getPhotos(req.params.id)
      success(res, photos)
    } catch (e) {
      next(e)
    }
  },

  async delete(req, res, next) {
    try {
      const { id: postId, photoId } = req.params
      const result = await PostPhotoService.deletePhoto(
        postId,
        req.user.id,
        photoId
      )
      success(res, result)
    } catch (e) {
      next(e)
    }
  },

  async update(req, res, next) {
    try {
      const { id: postId, photoId } = req.params
      const file = req.file
      const updated = await PostPhotoService.updatePhoto(
        postId,
        req.user.id,
        photoId,
        file
      )
      success(res, updated)
    } catch (e) {
      next(e)
    }
  },
}
