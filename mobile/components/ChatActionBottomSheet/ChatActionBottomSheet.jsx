import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native'
import BottomSheetModal, {
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import { chatApi } from '@entities/chatApi/chatApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const ChatActionBottomSheet = ({ chat, visible, onClose, onDeleted }) => {
  const bottomSheetModalRef = useRef(null)

  const snapPoints = useMemo(() => [150], [])

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
    if (!bottomSheetModalRef.current) return

    if (visible && chat) {
      const timeoutId = setTimeout(() => {
        const ref = bottomSheetModalRef.current
        if (ref && typeof ref.present === 'function') {
          try {
            ref.present()
          } catch (error) {
          }
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    } else if (!visible) {
      const ref = bottomSheetModalRef.current
      if (ref && typeof ref.dismiss === 'function') {
        try {
          ref.dismiss()
        } catch {}
      }
    }
  }, [visible, chat])

  const handleDeleteChat = async () => {
    if (!chat?.id) return

    Alert.alert(
      'Удалить чат',
      'Вы уверены, что хотите удалить этот чат?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatApi.deleteChat(chat.id)
              if (
                bottomSheetModalRef.current &&
                typeof bottomSheetModalRef.current.dismiss === 'function'
              ) {
                bottomSheetModalRef.current.dismiss()
              }
              setTimeout(() => {
                onDeleted?.()
              }, 100)
            } catch (e) {
              Alert.alert('Ошибка', getServerErrorMessage(e))
            }
          },
        },
      ]
    )
  }

  if (!chat) return null

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose
      enableDynamicSizing={false}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      keyboardBehavior={Platform.OS === 'ios' ? 'fillParent' : 'interactive'}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enableBlurKeyboardOnGesture={true}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeleteChat}
        >
          <AppText style={styles.deleteButtonText}>Удалить</AppText>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
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
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.lowGreen,
  },
  deleteButton: {
    backgroundColor: colors.orange,
  },
  deleteButtonText: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    fontFamily: 'Unbounded-Regular',
  },
})

export default ChatActionBottomSheet
