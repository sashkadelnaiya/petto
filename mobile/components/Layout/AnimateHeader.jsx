import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  StatusBar,
  useWindowDimensions,
} from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@assets'
import { AppText } from '@components/AppText/AppText'
import { TextInputField } from '@components/TextInputField/TextInputField'

const AnimateHeader = ({
  activeTab,
  onTabChange,
  position,
  onPostAddPress,
  searchValue,
  onSearchChange,
  onFilterPress,
}) => {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [isSearchVisible, setIsSearchVisible] = useState(false)

  const HORIZONTAL_MARGIN = 60
  const TABS_COUNT = 2

  const containerWidth = width - HORIZONTAL_MARGIN * 2
  const indicatorWidth = containerWidth / TABS_COUNT - 20

  const translateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [0, indicatorWidth],
  })

  const handleSearchPress = () => {
    if (isSearchVisible) {
      onSearchChange?.('')
    }
    setIsSearchVisible(!isSearchVisible)
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        {/* TOP ROW */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => onTabChange(0)}
          >
            <Image
              source={
                activeTab === 0
                  ? require('@assets/readerActive.png')
                  : require('@assets/reader.png')
              }
            />
            <AppText
              style={{
                color: activeTab === 0 ? colors.green : colors.lowGreen,
                fontFamily: 'Unbounded-Regular',
                fontSize: 16,
              }}
            >
              Лента
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => onTabChange(1)}
          >
            <Image
              source={
                activeTab === 1
                  ? require('@assets/map-f_active.png')
                  : require('@assets/map-f.png')
              }
            />
            <AppText
              style={{
                color: activeTab === 1 ? colors.green : colors.lowGreen,
                fontFamily: 'Unbounded-Regular',
                fontSize: 16,
              }}
            >
              Карта
            </AppText>
          </TouchableOpacity>
        </View>

        {/* INDICATOR */}
        <View style={styles.indicatorContainer}>
          <Animated.View
            style={[styles.indicator, { transform: [{ translateX }] }]}
          />
        </View>

        {/* SEARCH ROW */}
        {isSearchVisible && (
          <View style={styles.searchRow}>
            <TextInputField
              placeholder="Поиск по хештегу..."
              placeholderTextColor={colors.gray}
              value={searchValue}
              onChangeText={onSearchChange}
              style={styles.searchInput}
              autoFocus
            />
          </View>
        )}

        {/* ACTION ROW */}
        <View
          style={[
            styles.actionRow,
            isSearchVisible && { marginTop: 12, top: 0 },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSearchPress}
          >
            <Image source={require('@assets/search.png')} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onFilterPress}>
            <Image source={require('@assets/filter.png')} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onPostAddPress}
          >
            <Image source={require('@assets/post_add.png')} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    zIndex: 10,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 60,
    gap: 50,
  },

  modeButton: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  indicatorContainer: {
    flexDirection: 'row',
    marginHorizontal: 60,
    marginTop: 8,
    position: 'relative',
  },

  indicator: {
    position: 'absolute',
    width: '50%',
    height: 3,
    backgroundColor: colors.green,
    borderRadius: 2,
  },

  searchRow: {
    marginTop: 16,
    paddingHorizontal: 60,
  },

  searchInput: {
    marginBottom: 0,
    borderColor: colors.green,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
    paddingHorizontal: 60,
    top: 40,
  },

  actionButton: {},
})

export default AnimateHeader
