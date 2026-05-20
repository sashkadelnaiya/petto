const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const upload = require('../middlewares/upload')
const Controller = require('../controllers/postPhotoController')

router.post('/:id/photos', auth, upload.array('photos', 5), Controller.upload)

router.get('/:id/photos', Controller.get)
router.delete('/:id/photos/:photoId', auth, Controller.delete)
router.put(
  '/:id/photos/:photoId',
  auth,
  upload.single('photo'),
  Controller.update
)

module.exports = router
