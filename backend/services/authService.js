const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const UserModel = require('../models/userModel')
const RefreshTokenModel = require('../models/refreshTokenModel')
const jwtConfig = require('../config/jwt')
const AppError = require('../utils/AppError')
const ERRORS = require('../utils/errors')

function generateAccessToken(user) {
  return jwt.sign({ id: user.id }, jwtConfig.access.secret, {
    expiresIn: jwtConfig.access.expiresIn,
  })
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, jwtConfig.refresh.secret, {
    expiresIn: jwtConfig.refresh.expiresIn,
  })
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 6 &&
    password.length <= 50
  )
}

function validateName(name) {
  return (
    typeof name === 'string' &&
    name.trim().length > 0 &&
    name.trim().length <= 50
  )
}

module.exports = {
  async register(data) {
    const name = data.name?.trim()
    const email = data.email?.trim().toLowerCase()
    const password = data.password

    if (
      !validateName(name) ||
      !validateEmail(email) ||
      !validatePassword(password)
    ) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      throw new AppError(ERRORS.EMAIL_ALREADY_EXISTS, 409)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await RefreshTokenModel.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    return { user, accessToken, refreshToken }
  },

  async login({ email, password }) {
    if (!email || !password) {
      throw new AppError(ERRORS.INVALID_INPUT, 400)
    }

    const user = await UserModel.findByEmail(email.toLowerCase())
    if (!user) {
      throw new AppError(ERRORS.INVALID_CREDENTIALS, 401)
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new AppError(ERRORS.INVALID_CREDENTIALS, 401)
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await RefreshTokenModel.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    }
  },

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new AppError(ERRORS.REFRESH_TOKEN_REQUIRED, 401)
    }

    const stored = await RefreshTokenModel.find(refreshToken)
    if (!stored) {
      throw new AppError(ERRORS.INVALID_TOKEN, 401)
    }

    jwt.verify(refreshToken, jwtConfig.refresh.secret)

    const accessToken = jwt.sign(
      { id: stored.user_id },
      jwtConfig.access.secret,
      {
        expiresIn: jwtConfig.access.expiresIn,
      }
    )

    return { accessToken }
  },

  async logout(refreshToken) {
    if (!refreshToken) throw new Error('Refresh token is required')
    await RefreshTokenModel.delete(refreshToken)
    return true
  },
}
