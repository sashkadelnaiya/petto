import React, { useState, useRef } from 'react'
import {
  Modal,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const ImageViewer = ({ visible, images = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const scrollViewRef = useRef(null)

  React.useEffect(() => {
    if (visible && images.length > 0 && initialIndex >= 0) {
      setCurrentIndex(initialIndex)
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: initialIndex * SCREEN_WIDTH,
            animated: false,
          })
        }
      }, 100)
    }
  }, [visible, initialIndex, images.length])

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(contentOffsetX / SCREEN_WIDTH)
    setCurrentIndex(index)
  }

  if (!visible || images.length === 0) return null

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Кнопка закрытия */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <AppText style={styles.closeButtonText}>✕</AppText>
        </TouchableOpacity>

        {/* Индикатор текущего изображения */}
        <View style={styles.indicatorContainer}>
          <AppText style={styles.indicatorText}>
            {currentIndex + 1} / {images.length}
          </AppText>
        </View>

        {/* Прокручиваемая область с изображениями */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
        >
          {images.map((uri, index) => (
            <Image
              key={index}
              source={{ uri }}
              style={styles.image}
              resizeMode="contain"
            />
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  indicatorContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  indicatorText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Cruinn-Regular',
  },
  scrollView: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
})

export default ImageViewer
