import { authApi } from '@entities/authApi/authApi'
import { tokenStorage } from './tokenStorage'

export const auth = {
  async login(email, password) {
    const response = await authApi.login(email, password)
    const { accessToken, refreshToken, user } = response.data
    if (!accessToken || !refreshToken) throw new Error('Invalid tokens')
    await tokenStorage.setTokens(accessToken, refreshToken)
    return user
  },

  async register(name, email, password) {
    const response = await authApi.register(name, email, password)
    const { accessToken, refreshToken, user } = response.data
    if (!accessToken || !refreshToken) throw new Error('Invalid tokens')
    await tokenStorage.setTokens(accessToken, refreshToken)
    return user
  },

  async isLoggedIn() {
    const token = await tokenStorage.getAccessToken()
    return Boolean(token)
  },

  async logout() {
    const refreshToken = await tokenStorage.getRefreshToken()
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch (e) {
      }
    }
    await tokenStorage.clear()
  },

  async refresh(refreshToken) {
    const response = await authApi.refresh(refreshToken)
    const { accessToken } = response.data
    await tokenStorage.setTokens(accessToken, refreshToken)
    return accessToken
  },

  async me() {
    return await authApi.me()
  },
}
