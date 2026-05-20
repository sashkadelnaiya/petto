const jwt = require('jsonwebtoken')
const jwtConfig = require('../config/jwt')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return next(new AppError(ERRORS.UNAUTHORIZED, 401))
  }

  const [, token] = authHeader.split(' ')

  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret)
    req.user = decoded
    next()
  } catch {
    next(new AppError(ERRORS.INVALID_TOKEN, 401))
  }
}
