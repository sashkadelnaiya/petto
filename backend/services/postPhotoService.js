const fs = require('fs')
const path = require('path')
const PostModel = require('../models/postModel')
const PostPhotoModel = require('../models/postPhotoModel')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = {
  async upload(postId, userId, files) {
    if (!files || !files.length) {
      throw new AppError(ERRORS.NO_FILES_UPLOADED, 400)
    }

    const post = await PostModel.getById(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    if (post.author_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    const savedPhotos = []

    for (const file of files) {
      if (!file.filename) {
        throw new AppError(ERRORS.FILE_REQUIRED, 400)
      }
      const filePath = `/uploads/posts/${file.filename}`
      const photo = await PostPhotoModel.add(postId, filePath)
      savedPhotos.push(photo)
    }

    return savedPhotos
  },

  async getPhotos(postId) {
    return await PostPhotoModel.getByPost(postId)
  },

  async deletePhoto(postId, userId, photoId) {
    const post = await PostModel.getById(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    if (post.author_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    const photos = await PostPhotoModel.getByPost(postId)
    const photo = photos.find((p) => p.id === Number(photoId))
    if (!photo) {
      throw new AppError(ERRORS.PHOTO_NOT_FOUND, 404)
    }

    const filePath = path.join(__dirname, '..', photo.path)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    await PostPhotoModel.delete(photoId)
    return true
  },

  async updatePhoto(postId, userId, photoId, file) {
    if (!file || !file.filename) {
      throw new AppError(ERRORS.FILE_REQUIRED, 400)
    }

    const post = await PostModel.getById(postId)
    if (!post) {
      throw new AppError(ERRORS.POST_NOT_FOUND, 404)
    }
    if (post.author_id !== userId) {
      throw new AppError(ERRORS.NO_PERMISSION, 403)
    }

    const photos = await PostPhotoModel.getByPost(postId)
    const photo = photos.find((p) => p.id === Number(photoId))
    if (!photo) {
      throw new AppError(ERRORS.PHOTO_NOT_FOUND, 404)
    }

    const oldPath = path.join(__dirname, '..', photo.path)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)

    const newPath = `/uploads/posts/${file.filename}`
    await PostPhotoModel.update(photoId, newPath)

    return { id: photoId, path: newPath }
  },
}
