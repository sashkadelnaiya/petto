import { useState, useEffect } from 'react'
import { Image, View, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Asset } from 'expo-asset'
import { backgrounds, colors } from '@assets/index'
import Header from '@components/Layout/Header'
import { Loader } from '@components/Loader/Loader'

const AppLayout = ({
  children,
  background = backgrounds.hourglassMain,
  scroll = false,
  header = <Header />,
  hasHeader = true,
}) => {
  const [ready, setReady] = useState(false)
  const ContentWrapper = scroll ? ScrollView : View
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (background) {
      Asset.fromModule(background)
        .downloadAsync()
        .then(() => {
          setReady(true)
        })
        .catch(() => {
          setReady(true)
        })
    } else {
      setReady(true)
    }
  }, [background])

  if (!ready) {
    return <Loader />
  }

  return (
    <View style={styles.container}>
      {background && (
        <Image source={background} style={StyleSheet.absoluteFill} />
      )}

      {header}

      <ContentWrapper
        style={[
          styles.content,
          !scroll &&
            hasHeader && {
              paddingTop: 40 + insets.top,
            },
        ]}
        contentContainerStyle={
          scroll && [
            styles.scrollContent,
            {
              paddingTop: 40 + insets.top,
              paddingBottom: insets.bottom + 20,
            },
          ]
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ContentWrapper>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },

  content: {
    flex: 1,
    zIndex: 1,
  },

  scrollContent: {},
})

export default AppLayout
