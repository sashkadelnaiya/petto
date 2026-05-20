module.exports = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET || 'access_secret',
    expiresIn: '1d',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    expiresIn: '30d',
  },
}
