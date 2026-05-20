const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const Controller = require('../controllers/favoriteController')

router.post('/posts/:id/favorite', auth, Controller.add)
router.delete('/posts/:id/favorite', auth, Controller.remove)
router.get('/me/favorites', auth, Controller.myFavorites)

module.exports = router
