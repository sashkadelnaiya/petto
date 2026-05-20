import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useForm, Controller } from 'react-hook-form'
import BottomSheetModal, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import { ButtonPrimary } from '@components/ButtonPrimary/ButtonPrimary'
import { userApi } from '@entities/userApi/userApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const EditUserBottomSheet = ({ user, visible, onClose, onSaved }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [avatarToDelete, setAvatarToDelete] = useState(false)
  const [uploading, setUploading] = useState(false)

  const bottomSheetModalRef = useRef(null)

  const snapPoints = useMemo(() => ['75%'], [])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      oldPassword: '',
      newPassword: '',
    },
    mode: 'onChange',
  })

  const getAvatarUri = (avatarPath) => {
    if (!avatarPath) return null
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    if (avatarPath.startsWith('http')) return avatarPath
    return `${baseURL}${avatarPath}`
  }

  const loadUserData = useCallback(async () => {
    if (!user) return

    try {
      reset({
        name: user.name || '',
        email: user.email || '',
        oldPassword: '',
        newPassword: '',
      })
      setSelectedAvatar(null)
      setAvatarToDelete(false)
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    }
  }, [user, reset])

  useEffect(() => {
    if (visible && user) {
      loadUserData()
      const timeoutId = setTimeout(() => {
        const ref = bottomSheetModalRef.current
        if (ref && typeof ref.snapToIndex === 'function') {
          try {
            ref.snapToIndex(0)
          } catch (error) {
          }
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    } else if (!visible) {
      const ref = bottomSheetModalRef.current
      if (ref && typeof ref.close === 'function') {
        try {
          ref.close()
        } catch {}
      }
    }
  }, [visible, user, loadUserData])

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
    setSelectedAvatar(null)
    setAvatarToDelete(false)
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

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Необходимо разрешение',
        'Для выбора фотографии необходимо разрешение на доступ к галерее'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: Platform.OS === 'ios',
      aspect: Platform.OS === 'ios' ? [1, 1] : undefined,
      quality: 0.8,
      selectionLimit: 1,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0]
      setSelectedAvatar({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `avatar_${Date.now()}.jpg`,
      })
      // Сбрасываем флаг удаления, если пользователь выбрал новое фото
      setAvatarToDelete(false)
    }
  }

  const removeAvatar = () => {
    Alert.alert('Удалить аватар', 'Вы уверены, что хотите удалить аватар?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          setSelectedAvatar(null)
          setAvatarToDelete(true)
        },
      },
    ])
  }

  const onSubmit = async (data) => {
    setUploading(true)
    try {
      const updateData = {}
      if (data.name && data.name.trim() !== user?.name) {
        updateData.name = data.name.trim()
      }
      if (data.email && data.email.trim() !== user?.email) {
        updateData.email = data.email.trim()
      }

      if (Object.keys(updateData).length > 0) {
        await userApi.updateProfile(updateData)
      }

      if (data.newPassword && data.newPassword.trim()) {
        if (!data.oldPassword || !data.oldPassword.trim()) {
          Alert.alert(
            'Ошибка',
            'Для смены пароля необходимо ввести старый пароль'
          )
          setUploading(false)
          return
        }
        if (data.newPassword.length < 6) {
          Alert.alert('Ошибка', 'Новый пароль должен быть не менее 6 символов')
          setUploading(false)
          return
        }
        await userApi.changePassword(
          data.oldPassword.trim(),
          data.newPassword.trim()
        )
      } else if (
        data.oldPassword &&
        data.oldPassword.trim() &&
        !data.newPassword
      ) {
        Alert.alert('Ошибка', 'Необходимо указать новый пароль')
        setUploading(false)
        return
      }

      if (avatarToDelete) {
        await userApi.deleteAvatar()
      } else if (selectedAvatar) {
        const formData = new FormData()
        formData.append('avatar', {
          uri: selectedAvatar.uri,
          type: selectedAvatar.type || 'image/jpeg',
          name: selectedAvatar.name || `avatar.jpg`,
        })
        await userApi.updateAvatar(formData)
      }

      Alert.alert('Успех', 'Профиль успешно обновлен', [
        {
          text: 'OK',
          onPress: () => {
            if (
              bottomSheetModalRef.current &&
              typeof bottomSheetModalRef.current.dismiss === 'function'
            ) {
              bottomSheetModalRef.current.dismiss()
            }
            onSaved?.()
          },
        },
      ])
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  if (!user) return null

  const currentAvatarUri = avatarToDelete
    ? null
    : selectedAvatar
    ? selectedAvatar.uri
    : user.avatar
    ? getAvatarUri(user.avatar)
    : null

  const showRemoveButton = (selectedAvatar || (user.avatar && !avatarToDelete)) && !avatarToDelete

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={-1}
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
      animateOnMount={true}
    >
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        bounces={false}
      >
        {/* Аватар */}
        <View style={styles.avatarSection}>
          <AppText style={styles.sectionTitle}>Аватар</AppText>
          <View style={styles.avatarContainer}>
            {currentAvatarUri ? (
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: currentAvatarUri }}
                  style={styles.avatarImage}
                />
                {showRemoveButton && (
                  <TouchableOpacity
                    style={styles.removeAvatarButton}
                    onPress={removeAvatar}
                  >
                    <AppText style={styles.removeAvatarButtonText}>✕</AppText>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Image
                  source={require('@assets/avatar.png')}
                  style={styles.avatarPlaceholderImage}
                />
              </View>
            )}
            <TouchableOpacity
              style={styles.changeAvatarButton}
              onPress={pickAvatar}
            >
              <AppText style={styles.changeAvatarButtonText}>
                {currentAvatarUri ? 'Изменить аватар' : 'Добавить аватар'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Имя */}
        <Controller
          control={control}
          name="name"
          rules={{ required: 'Имя обязательно' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <BottomSheetTextInput
                placeholder="Имя *"
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={styles.textInput}
              />
              {errors.name && (
                <AppText style={styles.errorText}>
                  {errors.name.message}
                </AppText>
              )}
            </View>
          )}
        />

        {/* Email */}
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email обязателен',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Неверный формат email',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <BottomSheetTextInput
                placeholder="Email *"
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.textInput}
              />
              {errors.email && (
                <AppText style={styles.errorText}>
                  {errors.email.message}
                </AppText>
              )}
            </View>
          )}
        />

        {/* Старый пароль */}
        <Controller
          control={control}
          name="oldPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <BottomSheetTextInput
                placeholder="Старый пароль"
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                style={styles.textInput}
              />
            </View>
          )}
        />

        {/* Новый пароль */}
        <Controller
          control={control}
          name="newPassword"
          rules={{
            minLength: {
              value: 6,
              message: 'Пароль должен быть не менее 6 символов',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <BottomSheetTextInput
                placeholder="Новый пароль"
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                style={styles.textInput}
              />
              {errors.newPassword && (
                <AppText style={styles.errorText}>
                  {errors.newPassword.message}
                </AppText>
              )}
            </View>
          )}
        />

        {/* Кнопки действий */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleDismiss}
            disabled={uploading || isSubmitting}
          >
            <AppText style={styles.cancelButtonText}>Отменить</AppText>
          </TouchableOpacity>
          <ButtonPrimary
            title="Сохранить"
            onPress={handleSubmit(onSubmit)}
            disabled={uploading || isSubmitting}
            loading={uploading || isSubmitting}
            style={styles.saveButton}
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: colors.lowOrange,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Cruinn-Regular',
    marginBottom: 16,
    backgroundColor: colors.white,
    color: colors.fullBlack,
  },
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
  },
  avatarSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.fullBlack,
    fontFamily: 'Unbounded-Regular',
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.lowGreen,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray,
    borderWidth: 3,
    borderColor: colors.lowGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  removeAvatarButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.fullBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  removeAvatarButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeAvatarButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.lowGreen,
  },
  changeAvatarButtonText: {
    fontSize: 14,
    color: colors.fullBlack,
    fontFamily: 'Unbounded-Regular',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.white,
    fontFamily: 'Unbounded-Regular',
  },
  saveButton: {
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 16,
    width: '100%',
    minHeight: 50,
  },
  errorText: {
    color: colors.orange,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Cruinn-Regular',
  },
})

export default EditUserBottomSheet
