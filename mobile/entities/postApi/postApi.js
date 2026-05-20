import { baseApi } from '@utils/baseApi'

export const postApi = {
  getAll: (filters = {}) => {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.hashtag) params.hashtag = filters.hashtag
    if (typeof filters.limit === 'number') params.limit = filters.limit
    if (typeof filters.offset === 'number') params.offset = filters.offset
    return baseApi.get('/posts', { params })
  },

  getById: (id) => baseApi.get(`/posts/${id}`),

  create: (data) => baseApi.post('/posts', data),

  getMyPosts: () => baseApi.get('/posts/me/my-posts'),

  update: (id, data) => baseApi.put(`/posts/${id}`, data),

  delete: (id) => baseApi.delete(`/posts/${id}`),

  getPhotos: (postId) => baseApi.get(`/posts/${postId}/photos`),

  uploadPhotos: (postId, formData) =>
    baseApi.post(`/posts/${postId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deletePhoto: (postId, photoId) =>
    baseApi.delete(`/posts/${postId}/photos/${photoId}`),

  getComments: (postId) => baseApi.get(`/posts/${postId}/comments`),

  createComment: (postId, text) =>
    baseApi.post(`/posts/${postId}/comments`, { text }),

  deleteComment: (commentId) => baseApi.delete(`/comments/${commentId}`),

  editComment: (commentId, text) =>
    baseApi.put(`/comments/${commentId}`, { text }),

  addFavorite: (postId) => baseApi.post(`/posts/${postId}/favorite`),

  removeFavorite: (postId) => baseApi.delete(`/posts/${postId}/favorite`),

  getFavorites: () => baseApi.get('/me/favorites'),
}
