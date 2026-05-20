import { baseApi } from '@utils/baseApi'

export const authApi = {
  login: (email, password) => baseApi.post('/auth/login', { email, password }),

  register: (name, email, password) =>
    baseApi.post('/auth/register', { name, email, password }),

  refresh: (refreshToken) => baseApi.post('/auth/refresh', { refreshToken }),

  me: () => baseApi.get('/me'),

  logout: (refreshToken) => baseApi.post('/auth/logout', { refreshToken }),
}
