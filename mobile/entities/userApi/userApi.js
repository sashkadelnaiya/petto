import { baseApi } from '@utils/baseApi'

export const userApi = {
  getProfile: () => baseApi.get('/me'),

  getUserById: (userId) => baseApi.get(`/user/${userId}`),

  updateProfile: (data) => baseApi.put('/me', data),

  updateAvatar: (formData) =>
    baseApi.post('/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAvatar: () => baseApi.delete('/me/avatar'),

  changePassword: (oldPassword, newPassword) =>
    baseApi.put('/me/password', { oldPassword, newPassword }),
}
