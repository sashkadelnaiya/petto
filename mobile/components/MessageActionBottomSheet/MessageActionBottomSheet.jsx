import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native'
import BottomSheetModal, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import { chatApi } from '@entities/chatApi/chatApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const MessageActionBottomSheet = ({
  message,
  visible,
  onClose,
  onMessageUpdated,
}) => {
  const [editingMessage, setEditingMessage] = useState(null)
  const [editMessageText, setEditMessageText] = useState('')
  const bottomSheetModalRef = useRef(null)

  const snapPoints = useMemo(() => {
    return editingMessage ? [300] : [200]
  }, [editingMessage])

  const handleSheetChanges = useCallback(
    (index) => {
      if (index === -1) {
        onClose?.()
        setEditingMessage(null)
        setEditMessageText('')
      }
    },
    [onClose]
  )

  const handleDismiss = useCallback(() => {
    onClose?.()
    setEditingMessage(null)
    setEditMessageText('')
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

    if (visible && message) {
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
  }, [visible, message])

  const handleDeleteMessage = async () => {
    if (!message?.id) return

    Alert.alert(
      'Удалить сообщение',
      'Вы уверены, что хотите удалить это сообщение?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatApi.deleteMessage(message.id)
              if (
                bottomSheetModalRef.current &&
                typeof bottomSheetModalRef.current.dismiss === 'function'
              ) {
                bottomSheetModalRef.current.dismiss()
              }
              onMessageUpdated?.()
            } catch (e) {
              Alert.alert('Ошибка', getServerErrorMessage(e))
            }
          },
        },
      ]
    )
  }

  const handleEditMessage = () => {
    if (!message) return
    setEditingMessage(message)
    setEditMessageText(message.text)
  }

  const handleSaveEditMessage = async () => {
    if (!editingMessage?.id || !editMessageText.trim()) return

    try {
      await chatApi.editMessage(editingMessage.id, editMessageText.trim())
      if (
        bottomSheetModalRef.current &&
        typeof bottomSheetModalRef.current.dismiss === 'function'
      ) {
        bottomSheetModalRef.current.dismiss()
      }
      setEditingMessage(null)
      setEditMessageText('')
      onMessageUpdated?.()
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    }
  }

  if (!message) return null

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
        {editingMessage ? (
          <>
            <BottomSheetTextInput
              style={styles.editMessageInput}
              placeholder="Редактировать сообщение..."
              placeholderTextColor={colors.gray}
              value={editMessageText}
              onChangeText={setEditMessageText}
              multiline
              autoFocus
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setEditingMessage(null)
                  setEditMessageText('')
                }}
              >
                <AppText style={styles.cancelButtonText}>Отмена</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.saveButton,
                  !editMessageText.trim() && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveEditMessage}
                disabled={!editMessageText.trim()}
              >
                <AppText style={styles.saveButtonText}>Сохранить</AppText>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditMessage}
            >
              <AppText style={styles.actionButtonText}>Редактировать</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteMessage}
            >
              <AppText style={styles.deleteButtonText}>Удалить</AppText>
            </TouchableOpacity>
          </>
        )}
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
  actionButtonText: {
    fontSize: 16,
    color: colors.fullBlack,
    textAlign: 'center',
    fontFamily: 'Unbounded-Regular',
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
  editMessageInput: {
    borderWidth: 1,
    borderColor: colors.lowGreen,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
    minHeight: 80,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    fontFamily: 'Unbounded-Regular',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.orange,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    fontFamily: 'Unbounded-Regular',
  },
})

export default MessageActionBottomSheet
