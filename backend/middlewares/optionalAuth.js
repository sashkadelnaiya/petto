const jwt = require('jsonwebtoken')
const jwtConfig = require('../config/jwt')

module.exports = function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }
  const token = authHeader.split(' ')[1]
  if (!token) return next()
  try {
    req.user = jwt.verify(token, jwtConfig.access.secret)
  } catch {}
  next()
}
