import { View, StyleSheet, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@assets/index'

const Header = () => {
  const insets = useSafeAreaInsets()

  return (
    <>
      <StatusBar barStyle="light-content" />

      <View
        style={[
          styles.container,
          {
            height: 40 + insets.top,
            paddingTop: insets.top,
          },
        ]}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
})

export default Header
