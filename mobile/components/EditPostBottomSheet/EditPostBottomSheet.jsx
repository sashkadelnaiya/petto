import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useForm, Controller } from 'react-hook-form'
import DateTimePicker from '@react-native-community/datetimepicker'
import BottomSheetModal, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import { ButtonPrimary } from '@components/ButtonPrimary/ButtonPrimary'
import YandexMapView from '@components/YandexMap/YandexMapView'
import { postApi } from '@entities/postApi/postApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const EditPostBottomSheet = ({ post, visible, onClose, onSaved }) => {
  const [selectedImages, setSelectedImages] = useState([])
  const [existingPhotos, setExistingPhotos] = useState([])
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([])
  const [uploading, setUploading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mapRegion, setMapRegion] = useState({
    latitude: 55.7558,
    longitude: 37.6173,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  })

  const bottomSheetModalRef = useRef(null)

  const snapPoints = useMemo(() => ['95%'], [])

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      status: 'lost',
      description: '',
      event_date: new Date(),
      address: '',
      hashtag: '',
      latitude: '',
      longitude: '',
    },
    mode: 'onChange',
  })

  const status = watch('status')
  const latitude = watch('latitude')
  const longitude = watch('longitude')

  const getCoordinate = (formValue, postValue) => {
    if (formValue && formValue.toString().trim() !== '') {
      const num = Number(formValue)
      return !isNaN(num) ? num : null
    }
    if (postValue != null && postValue.toString().trim() !== '') {
      const num = Number(postValue)
      return !isNaN(num) ? num : null
    }
    return null
  }

  const markerLatitude = getCoordinate(latitude, post?.latitude)
  const markerLongitude = getCoordinate(longitude, post?.longitude)

  const getPhotoUri = (photoPath) => {
    if (!photoPath) return null
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    if (photoPath.startsWith('http')) return photoPath
    return `${baseURL}${photoPath}`
  }

  const loadPostData = useCallback(async () => {
    if (!post?.id) return

    setLoading(true)
    try {
      const photosRes = await postApi.getPhotos(post.id)
      const photos = Array.isArray(photosRes)
        ? photosRes
        : photosRes?.data || []
      setExistingPhotos(photos)
      setDeletedPhotoIds([])

      const eventDate = post.event_date ? new Date(post.event_date) : new Date()
      reset({
        status: post.status || 'lost',
        description: post.description || '',
        event_date: eventDate,
        address: post.address || '',
        hashtag: post.hashtag || '',
        latitude: post.latitude?.toString() || '',
        longitude: post.longitude?.toString() || '',
      })

      if (post.latitude != null && post.longitude != null) {
        const lat = Number(post.latitude)
        const lng = Number(post.longitude)
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          })
        }
      }

      setSelectedImages([])
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [post, reset])

  useEffect(() => {
    if (visible && post) {
      loadPostData()
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
  }, [visible, post, loadPostData])

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
    setSelectedImages([])
    setDeletedPhotoIds([])
    setShowDatePicker(false)
    setShowTimePicker(false)
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Необходимо разрешение',
        'Для добавления фотографий необходимо разрешение на доступ к галерее'
      )
      return
    }

    const totalPhotos = existingPhotos.length + selectedImages.length
    const remainingSlots = 5 - totalPhotos

    if (remainingSlots <= 0) {
      Alert.alert('Ошибка', 'Максимальное количество фотографий - 5')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remainingSlots,
    })

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type || 'image',
        name: asset.fileName || `photo_${Date.now()}.jpg`,
      }))
      setSelectedImages((prev) =>
        [...prev, ...newImages].slice(0, remainingSlots)
      )
    }
  }

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingPhoto = (photoId) => {
    Alert.alert(
      'Удалить фотографию',
      'Вы уверены, что хотите удалить эту фотографию?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            setDeletedPhotoIds((prev) => [...prev, photoId])
            setExistingPhotos((prev) =>
              prev.filter((photo) => photo.id !== photoId)
            )
          },
        },
      ]
    )
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const onSubmit = async (data) => {
    if (!data.latitude || !data.longitude) {
      Alert.alert('Ошибка', 'Выберите место на карте')
      return
    }

    setUploading(true)
    try {
      const postData = {
        status: data.status,
        description: data.description || null,
        event_date: formatDate(data.event_date),
        address: data.address,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        hashtag: data.hashtag?.trim().toLowerCase() || '',
      }

      await postApi.update(post.id, postData)

      if (deletedPhotoIds.length > 0) {
        await Promise.all(
          deletedPhotoIds.map((photoId) =>
            postApi.deletePhoto(post.id, photoId).catch(() => {
            })
          )
        )
      }

      if (selectedImages.length > 0) {
        const formData = new FormData()
        selectedImages.forEach((image, index) => {
          formData.append('photos', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || `photo_${index}.jpg`,
          })
        })

        await postApi.uploadPhotos(post.id, formData)
      }

      Alert.alert('Успех', 'Пост успешно обновлен', [
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

  if (!post) return null

  const totalPhotos = existingPhotos.length + selectedImages.length
  const remainingPhotosCount = existingPhotos.length + selectedImages.length

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      topInset={0}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      keyboardBehavior={Platform.OS === 'ios' ? 'fillParent' : 'interactive'}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enableBlurKeyboardOnGesture={true}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      animateOnMount={true}
    >
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        bounces={false}
      >
        {/* Статус поста */}
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.statusButtonLost,
              status === 'lost' && styles.statusButtonActiveLost,
            ]}
            onPress={() => setValue('status', 'lost')}
          >
            <AppText
              style={[
                styles.statusButtonText,
                styles.statusButtonTextLost,
                status === 'lost' && styles.statusButtonTextActive,
              ]}
            >
              Потеряно
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.statusButtonFound,
              status === 'found' && styles.statusButtonActiveFound,
            ]}
            onPress={() => setValue('status', 'found')}
          >
            <AppText
              style={[
                styles.statusButtonText,
                styles.statusButtonTextFound,
                status === 'found' && styles.statusButtonTextActive,
              ]}
            >
              Найдено
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Описание */}
        <Controller
          control={control}
          name="description"
          rules={{ required: 'Описание обязательно' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <BottomSheetTextInput
                placeholder="Описание"
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
                style={[styles.textInput, styles.descriptionInput]}
              />
              {errors.description && (
                <AppText style={styles.errorText}>
                  {errors.description.message}
                </AppText>
              )}
            </View>
          )}
        />

        {/* Дата события */}
        <View style={styles.dateSection}>
          <Controller
            control={control}
            name="event_date"
            rules={{ required: 'Дата события обязательна' }}
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(true)
                    } else {
                      setShowDatePicker(true)
                    }
                  }}
                >
                  <AppText style={styles.dateButtonText}>
                    {value ? formatDate(value) : 'Выберите дату и время *'}
                  </AppText>
                </TouchableOpacity>
                {Platform.OS === 'android' && (
                  <>
                    {showDatePicker && (
                      <DateTimePicker
                        value={value || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false)
                          if (selectedDate) {
                            const currentDate = value || new Date()
                            const newDate = new Date(selectedDate)
                            newDate.setHours(currentDate.getHours())
                            newDate.setMinutes(currentDate.getMinutes())
                            onChange(newDate)
                            setTimeout(() => setShowTimePicker(true), 100)
                          }
                        }}
                      />
                    )}
                    {showTimePicker && (
                      <DateTimePicker
                        value={value || new Date()}
                        mode="time"
                        display="default"
                        is24Hour={true}
                        onChange={(event, selectedTime) => {
                          setShowTimePicker(false)
                          if (selectedTime) {
                            const currentDate = value || new Date()
                            const newDate = new Date(currentDate)
                            newDate.setHours(selectedTime.getHours())
                            newDate.setMinutes(selectedTime.getMinutes())
                            onChange(newDate)
                          }
                        }}
                      />
                    )}
                  </>
                )}
                {Platform.OS === 'ios' && showDatePicker && (
                  <View style={styles.iosPickerContainer}>
                    <View style={styles.iosPickerButtons}>
                      <TouchableOpacity
                        style={styles.iosPickerButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <AppText style={styles.iosPickerButtonText}>
                          Отмена
                        </AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iosPickerButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <AppText
                          style={[
                            styles.iosPickerButtonText,
                            styles.iosPickerButtonTextConfirm,
                          ]}
                        >
                          Готово
                        </AppText>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={value || new Date()}
                      mode="datetime"
                      display="spinner"
                      is24Hour={true}
                      onChange={(event, selectedDate) => {
                        if (event.type !== 'dismissed' && selectedDate) {
                          onChange(selectedDate)
                        }
                      }}
                      style={styles.iosPicker}
                    />
                  </View>
                )}
              </>
            )}
          />
          {errors.event_date && (
            <AppText style={styles.errorText}>
              {errors.event_date.message}
            </AppText>
          )}
        </View>

        {/* Адрес */}
        <Controller
          control={control}
          name="address"
          rules={{ required: 'Адрес обязателен' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <BottomSheetTextInput
                placeholder="Адрес *"
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={styles.textInput}
              />
              {errors.address && (
                <AppText style={styles.errorText}>
                  {errors.address.message}
                </AppText>
              )}
            </View>
          )}
        />

        {/* Координаты - выбор на карте */}
        <View style={styles.mapSection}>
          <AppText style={styles.sectionTitle}>
            Выберите место на карте *
          </AppText>
          <Controller
            control={control}
            name="latitude"
            rules={{
              required: 'Выберите место на карте',
              validate: (value) => {
                const lng = watch('longitude')
                if (!value || !lng) {
                  return 'Выберите место на карте'
                }
                return true
              },
            }}
            render={() => (
              <>
                <View style={styles.mapContainer}>
                  <YandexMapView
                    style={styles.map}
                    center={
                      markerLatitude != null &&
                      markerLongitude != null &&
                      !isNaN(markerLatitude) &&
                      !isNaN(markerLongitude)
                        ? {
                            lat: Number(markerLatitude),
                            lon: Number(markerLongitude),
                          }
                        : {
                            lat: mapRegion.latitude,
                            lon: mapRegion.longitude,
                          }
                    }
                    zoom={12}
                    selectable
                    selectedPoint={
                      markerLatitude != null && markerLongitude != null
                        ? { lat: Number(markerLatitude), lon: Number(markerLongitude), status }
                        : null
                    }
                    onMapPress={({ lat, lon }) => {
                      const latitude = lat
                      const longitude = lon
                      setValue('latitude', latitude.toString(), {
                        shouldValidate: true,
                      })
                      setValue('longitude', longitude.toString(), {
                        shouldValidate: true,
                      })
                      setMapRegion({
                        ...mapRegion,
                        latitude,
                        longitude,
                      })
                    }}
                  />
                </View>
                {errors.latitude && (
                  <AppText style={styles.errorText}>
                    {errors.latitude.message}
                  </AppText>
                )}
                {latitude && longitude && !errors.latitude && (
                  <AppText style={styles.coordinatesText}>
                    Широта: {latitude?.slice(0, 8)} | Долгота:{' '}
                    {longitude?.slice(0, 8)}
                  </AppText>
                )}
              </>
            )}
          />
        </View>

        {/* Хештег */}
        <Controller
          control={control}
          name="hashtag"
          rules={{ required: 'Хештег обязателен' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <BottomSheetTextInput
                placeholder="Хештег *"
                placeholderTextColor={colors.gray}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={styles.textInput}
              />
              {errors.hashtag && (
                <AppText style={styles.errorText}>
                  {errors.hashtag.message}
                </AppText>
              )}
            </View>
          )}
        />

        {/* Фотографии */}
        <View style={styles.photosSection}>
          <AppText style={styles.sectionTitle}>
            Фотографии ({totalPhotos}/5)
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photosContainer}
          >
            {/* Существующие фотографии */}
            {existingPhotos.map((photo, index) => (
              <View key={`existing-${photo.id}`} style={styles.photoItem}>
                <Image
                  source={{ uri: getPhotoUri(photo.path) }}
                  style={styles.photo}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExistingPhoto(photo.id)}
                >
                  <AppText style={styles.removeButtonText}>✕</AppText>
                </TouchableOpacity>
              </View>
            ))}
            {/* Новые фотографии */}
            {selectedImages.map((image, index) => (
              <View key={`new-${index}`} style={styles.photoItem}>
                <Image source={{ uri: image.uri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <AppText style={styles.removeButtonText}>✕</AppText>
                </TouchableOpacity>
              </View>
            ))}
            {totalPhotos < 5 && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={pickImage}
              >
                <AppText style={styles.addPhotoButtonText}>+</AppText>
                <AppText style={styles.addPhotoButtonLabel}>Добавить</AppText>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

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
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
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
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateSection: {
    marginBottom: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.lowOrange,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
  },
  iosPickerContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.lowOrange,
  },
  iosPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iosPickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iosPickerButtonText: {
    fontSize: 16,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
  },
  iosPickerButtonTextConfirm: {
    color: colors.lowOrange,
    fontWeight: 'bold',
  },
  iosPicker: {
    height: 200,
  },
  mapSection: {
    marginBottom: 16,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.lowOrange,
    marginBottom: 12,
  },
  coordinatesText: {
    color: colors.fullBlack,
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Cruinn-Regular',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    backgroundColor: colors.white,
    shadowColor: colors.fullBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  markerPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.black,
  },
  photosSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.fullBlack,
    fontFamily: 'Unbounded-Regular',
    marginBottom: 12,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.fullBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lowGreen,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  addPhotoButtonText: {
    fontSize: 32,
    color: colors.gray,
    marginBottom: 4,
  },
  addPhotoButtonLabel: {
    fontSize: 12,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
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
  hintText: {
    color: colors.gray,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
    fontFamily: 'Cruinn-Regular',
  },
})

export default EditPostBottomSheet
