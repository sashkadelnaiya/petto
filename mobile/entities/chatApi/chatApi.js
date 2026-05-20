import { baseApi } from '@utils/baseApi'

export const chatApi = {
  createOrGetChat: (postId) => baseApi.post(`/posts/${postId}/chat`),

  getUserChats: () => baseApi.get('/chats'),

  getMessages: (chatId) => baseApi.get(`/chats/${chatId}/messages`),

  markMessagesAsRead: (chatId) =>
    baseApi.post(`/chats/${chatId}/read`),

  sendMessage: (chatId, text) =>
    baseApi.post(`/chats/${chatId}/messages`, { text }),

  deleteChat: (chatId) => baseApi.delete(`/chats/${chatId}`),

  deleteMessage: (messageId) => baseApi.delete(`/messages/${messageId}`),

  editMessage: (messageId, text) =>
    baseApi.put(`/messages/${messageId}`, { text }),
}
