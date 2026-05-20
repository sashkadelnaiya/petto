import * as SecureStore from 'expo-secure-store'

const ACCESS = 'access_token'
const REFRESH = 'refresh_token'

export const tokenStorage = {
  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync(ACCESS, access)
    await SecureStore.setItemAsync(REFRESH, refresh)
  },

  getAccessToken: () => SecureStore.getItemAsync(ACCESS),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH),

  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS)
    await SecureStore.deleteItemAsync(REFRESH)
  },
}
