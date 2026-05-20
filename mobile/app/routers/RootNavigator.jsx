import { NavigationContainer } from '@react-navigation/native'
import { useContext } from 'react'
import { AuthContext } from '@app/contexts/AuthContext'
import { Loader } from '@components/Loader/Loader'
import AppNavigator from './AppNavigator'
import AuthNavigator from './AuthNavigator'

export default function RootNavigator() {
  const { isLoggedIn, loading } = useContext(AuthContext)

  if (loading) return <Loader />

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
