import { useRef, useCallback, useMemo, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'

const FilterBottomSheet = ({
  visible,
  onClose,
  selectedStatus,
  onStatusChange,
}) => {
  const bottomSheetRef = useRef(null)
  const snapPoints = useMemo(() => [200], [])

  const handleSheetChanges = useCallback(
    (index) => {
      if (index === -1) {
        onClose?.()
      }
    },
    [onClose]
  )

  const handleDismiss = useCallback(() => {
    onClose?.()
  }, [onClose])

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        enableTouchThrough={false}
      />
    ),
    []
  )

  useEffect(() => {
    if (visible) {
      const timeoutId = setTimeout(() => {
        const ref = bottomSheetRef.current
        if (ref && typeof ref.snapToIndex === 'function') {
          try {
            ref.snapToIndex(0)
          } catch (error) {
          }
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    } else {
      const ref = bottomSheetRef.current
      if (ref && typeof ref.close === 'function') {
        try {
          ref.close()
        } catch {}
      }
    }
  }, [visible])

  const handleStatusSelect = (status) => {
    if (selectedStatus === status) {
      onStatusChange?.(null)
    } else {
      onStatusChange?.(status)
    }
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onClose={handleDismiss}
      enablePanDownToClose
      enableDynamicSizing={false}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
    >
      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.statusButtonLost,
              selectedStatus === 'lost' && styles.statusButtonActiveLost,
            ]}
            onPress={() => handleStatusSelect('lost')}
          >
            <AppText
              style={[
                styles.statusButtonText,
                styles.statusButtonTextLost,
                selectedStatus === 'lost' && styles.statusButtonTextActive,
              ]}
            >
              Потеряно
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.statusButtonFound,
              selectedStatus === 'found' && styles.statusButtonActiveFound,
            ]}
            onPress={() => handleStatusSelect('found')}
          >
            <AppText
              style={[
                styles.statusButtonText,
                styles.statusButtonTextFound,
                selectedStatus === 'found' && styles.statusButtonTextActive,
              ]}
            >
              Найдено
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: colors.gray,
    width: 40,
    height: 4,
  },
  content: {
    padding: 16,
  },
  statusContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  statusButtonLost: {
    borderColor: colors.fullBlack,
  },
  statusButtonFound: {
    borderColor: colors.fullBlack,
  },
  statusButtonActiveLost: {
    backgroundColor: colors.lowOrange,
  },
  statusButtonActiveFound: {
    backgroundColor: colors.green,
  },
  statusButtonText: {
    fontSize: 14,
    fontFamily: 'Unbounded-Regular',
  },
  statusButtonTextLost: {
    color: colors.lowOrange,
  },
  statusButtonTextFound: {
    color: colors.green,
  },
  statusButtonTextActive: {
    color: colors.white,
  },
})

export default FilterBottomSheet
