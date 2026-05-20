import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@assets'
import { TextInputField } from '@components/TextInputField/TextInputField'

const SavedPostsHeader = ({
  searchValue,
  onSearchChange,
  onFilterPress,
  isBottomSheetOpen = false,
}) => {
  const insets = useSafeAreaInsets()
  const [isSearchVisible, setIsSearchVisible] = useState(false)

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
            zIndex: isBottomSheetOpen ? undefined : 10,
          },
        ]}
      >
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
    position: 'relative',
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
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 60,
    top: 40,
  },

  actionButton: {},
})

export default SavedPostsHeader
