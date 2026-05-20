import 'react-native-gesture-handler'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { AuthProvider } from './contexts/AuthContext'
import RootNavigator from './routers/RootNavigator'
import { useFonts } from 'expo-font'
import { StyleSheet } from 'react-native'

export default function App() {
  const [fontsLoaded] = useFonts({
    'Unbounded-Regular': require('@assets/fonts/Unbounded-Regular.ttf'),
    'Cruinn-Regular': require('@assets/fonts/Cruinn-Regular.ttf'),
    'Cruinn-Bold': require('@assets/fonts/Cruinn-Bold.ttf'),
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <RootNavigator />
          </SafeAreaProvider>
        </AuthProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
