import { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { postApi } from '@entities/postApi/postApi'
import { colors } from '@assets'
import { AppText } from '@components/AppText/AppText'
import YandexMapView from '@components/YandexMap/YandexMapView'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const MapRoute = ({ onPostPress, searchHashtag, statusFilter }) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState({
    latitude: 55.7558, // Москва по умолчанию
    longitude: 37.6173,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  })

  const loadPosts = useCallback(async () => {
    try {
      const filters = {}
      if (searchHashtag?.trim()) {
        filters.hashtag = searchHashtag.trim().toLowerCase()
      }
      if (statusFilter) {
        filters.status = statusFilter
      }
      const response = await postApi.getAll(filters)
      const postsData = response.data || []

      const validPosts = postsData.filter(
        (post) =>
          post.latitude != null &&
          post.longitude != null &&
          !isNaN(Number(post.latitude)) &&
          !isNaN(Number(post.longitude))
      )

      setPosts(validPosts)

      if (validPosts.length > 0) {
        const latitudes = validPosts.map((p) => Number(p.latitude))
        const longitudes = validPosts.map((p) => Number(p.longitude))

        const minLat = Math.min(...latitudes)
        const maxLat = Math.max(...latitudes)
        const minLng = Math.min(...longitudes)
        const maxLng = Math.max(...longitudes)

        const centerLat = (minLat + maxLat) / 2
        const centerLng = (minLng + maxLng) / 2

        const latDelta = Math.max(maxLat - minLat, 0.05) * 1.5
        const lngDelta = Math.max(maxLng - minLng, 0.05) * 1.5

        setRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        })
      }

    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [searchHashtag, statusFilter])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  useFocusEffect(
    useCallback(() => {
      loadPosts()
    }, [loadPosts])
  )

  const getPhotoUri = (photoPath) => {
    if (!photoPath) return null
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    if (photoPath.startsWith('http')) return photoPath
    return `${baseURL}${photoPath}`
  }

  const handleMarkerPress = useCallback(
    (post) => {
      onPostPress?.(post)
    },
    [onPostPress]
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AppText style={styles.emptyText}>Постов с координатами пока нет</AppText>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            setLoading(true)
            loadPosts()
          }}
          disabled={loading}
        >
          <AppText style={styles.refreshButtonText}>
            {loading ? 'Загрузка...' : 'Обновить'}
          </AppText>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <YandexMapView
        style={styles.map}
        center={{ lat: region.latitude, lon: region.longitude }}
        zoom={10}
        markers={posts.map((post) => ({
          id: post.id,
          lat: Number(post.latitude),
          lon: Number(post.longitude),
          status: post.status,
          photo: getPhotoUri(post.photos?.[0]?.path || null),
        }))}
        onMarkerPress={(id) => {
          const post = posts.find((item) => String(item.id) === String(id))
          if (post) handleMarkerPress(post)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.fullBlack,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Cruinn-Regular',
  },
  refreshButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 120,
  },
  refreshButtonText: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Unbounded-Regular',
  },
})

export default MapRoute
