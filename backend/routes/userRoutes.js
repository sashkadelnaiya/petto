const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const UserController = require('../controllers/userController')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${req.user.id}${ext}`)
  },
})
const upload = multer({ storage })

router.get('/me', auth, UserController.getProfile)
router.put('/me', auth, UserController.updateProfile)
router.post(
  '/me/avatar',
  auth,
  upload.single('avatar'),
  UserController.updateAvatar
)
router.delete('/me/avatar', auth, UserController.deleteAvatar)
router.put('/me/password', auth, UserController.changePassword)
router.get('/user/:id', auth, UserController.getUserById)

module.exports = router
