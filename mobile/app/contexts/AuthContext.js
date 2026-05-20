import { createContext, useEffect, useState } from 'react'
import { auth } from '@utils/auth'
import { tokenStorage } from '@utils/tokenStorage'

export const AuthContext = createContext({
  isLoggedIn: false,
  loading: true,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
})

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    isLoggedIn: false,
    loading: true,
  })

  useEffect(() => {
    const init = async () => {
      try {
        const refreshToken = await tokenStorage.getRefreshToken()
        if (refreshToken) {
          try {
            const meResponse = await auth.me()

            const profileData = meResponse?.data || meResponse

            const user = profileData?.user

            if (user?.id) {
              setState({ isLoggedIn: true, loading: false, user })
            } else {
              setState({ isLoggedIn: false, loading: false })
            }
          } catch (meError) {
            await tokenStorage.clear()
            setState({ isLoggedIn: false, loading: false })
          }
        } else {
          setState({ isLoggedIn: false, loading: false })
        }
      } catch (e) {
        await tokenStorage.clear()
        setState({ isLoggedIn: false, loading: false })
      }
    }
    init()
  }, [])

  const login = async (email, password) => {
    try {
      const user = await auth.login(email, password)
      try {
        const meResponse = await auth.me()

        const profileData = meResponse?.data || meResponse

        const fullUser = profileData?.user || user
        setState({ isLoggedIn: true, loading: false, user: fullUser })
      } catch {
        setState({ isLoggedIn: true, loading: false, user })
      }
    } catch (e) {
      throw e
    }
  }

  const register = async (name, email, password) => {
    try {
      const user = await auth.register(name, email, password)
      try {
        const meResponse = await auth.me()

        const profileData = meResponse?.data || meResponse

        const fullUser = profileData?.user || user
        setState({ isLoggedIn: true, loading: false, user: fullUser })
      } catch {
        setState({ isLoggedIn: true, loading: false, user })
      }
    } catch (e) {
      throw e
    }
  }

  const logout = async () => {
    try {
      await auth.logout()
      setState({ isLoggedIn: false, loading: false })
    } catch (e) {
      setState({ isLoggedIn: false, loading: false })
      throw e
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: state.isLoggedIn,
        loading: state.loading,
        user: state.user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}