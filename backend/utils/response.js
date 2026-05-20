const ERRORS = require('./errors')

module.exports = {
  success(res, data, status = 200) {
    res.status(status).json({ success: true, data })
  },

  error(res, err) {
    const status = err.status || 500
    const code = err.code || ERRORS.SERVER_ERROR

    res.status(status).json({
      success: false,
      code,
    })
  },
}
