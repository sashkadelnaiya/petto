const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

module.exports = (err, req, res, next) => {
  console.error(err)

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: err.code,
      details: err.details ?? null,
    })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: ERRORS.INVALID_TOKEN,
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: ERRORS.INVALID_TOKEN,
    })
  }

  return res.status(500).json({
    success: false,
    error: ERRORS.SERVER_ERROR,
  })
}
