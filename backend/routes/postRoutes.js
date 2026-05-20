const express = require('express')
const router = express.Router()
const PostController = require('../controllers/postController')
const auth = require('../middlewares/auth')
const optionalAuth = require('../middlewares/optionalAuth')

router.get('/', optionalAuth, PostController.getAll)
router.post('/', auth, PostController.create)
router.get('/me/my-posts', auth, PostController.getMyPosts)
router.get('/:id', PostController.getById)
router.delete('/:id', auth, PostController.delete)
router.put('/:id', auth, PostController.update)

module.exports = router
