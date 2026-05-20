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
import { postApi } from '@entities/postApi/postApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const CommentActionBottomSheet = ({
  comment,
  visible,
  onClose,
  onCommentUpdated,
}) => {
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const bottomSheetModalRef = useRef(null)

  const snapPoints = useMemo(() => {
    return editingComment ? [300] : [200]
  }, [editingComment])

  const handleSheetChanges = useCallback(
    (index) => {
      if (index === -1) {
        onClose?.()
        setEditingComment(null)
        setEditCommentText('')
      }
    },
    [onClose]
  )

  const handleDismiss = useCallback(() => {
    onClose?.()
    setEditingComment(null)
    setEditCommentText('')
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

    if (visible && comment) {
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
  }, [visible, comment])

  const handleDeleteComment = async () => {
    if (!comment?.id) return

    Alert.alert(
      'Удалить комментарий',
      'Вы уверены, что хотите удалить этот комментарий?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await postApi.deleteComment(comment.id)
              if (
                bottomSheetModalRef.current &&
                typeof bottomSheetModalRef.current.dismiss === 'function'
              ) {
                bottomSheetModalRef.current.dismiss()
              }
              onCommentUpdated?.()
            } catch (e) {
              Alert.alert('Ошибка', getServerErrorMessage(e))
            }
          },
        },
      ]
    )
  }

  const handleEditComment = () => {
    if (!comment) return
    setEditingComment(comment)
    setEditCommentText(comment.text)
  }

  const handleSaveEditComment = async () => {
    if (!editingComment?.id || !editCommentText.trim()) return

    try {
      await postApi.editComment(editingComment.id, editCommentText.trim())
      if (
        bottomSheetModalRef.current &&
        typeof bottomSheetModalRef.current.dismiss === 'function'
      ) {
        bottomSheetModalRef.current.dismiss()
      }
      setEditingComment(null)
      setEditCommentText('')
      onCommentUpdated?.()
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    }
  }

  if (!comment) return null

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
        {editingComment ? (
          <>
            <BottomSheetTextInput
              style={styles.editCommentInput}
              placeholder="Редактировать комментарий..."
              placeholderTextColor={colors.gray}
              value={editCommentText}
              onChangeText={setEditCommentText}
              multiline
              autoFocus
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setEditingComment(null)
                  setEditCommentText('')
                }}
              >
                <AppText style={styles.cancelButtonText}>Отмена</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.saveButton,
                  !editCommentText.trim() && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveEditComment}
                disabled={!editCommentText.trim()}
              >
                <AppText style={styles.saveButtonText}>Сохранить</AppText>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditComment}
            >
              <AppText style={styles.actionButtonText}>Редактировать</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteComment}
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
  editCommentInput: {
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

export default CommentActionBottomSheet
