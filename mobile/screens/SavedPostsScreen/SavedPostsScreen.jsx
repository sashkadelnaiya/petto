import { useEffect, useState, useCallback } from 'react'
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import PostCard from '@components/PostCard/PostCard'
import { postApi } from '@entities/postApi/postApi'
import { colors } from '@assets'
import { AppText } from '@components/AppText/AppText'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'
import SavedPostsHeader from '@components/Layout/SavedPostsHeader'
import AppLayout from '@components/Layout/AppLayout'
import PostBottomSheet from '@components/PostBottomSheet/PostBottomSheet'
import FilterBottomSheet from '@components/FilterBottomSheet/FilterBottomSheet'

const SavedPostsScreen = () => {
  const [posts, setPosts] = useState([])
  const [favoritePostIds, setFavoritePostIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [scrollToComments, setScrollToComments] = useState(false)
  const [searchHashtag, setSearchHashtag] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [isFilterVisible, setIsFilterVisible] = useState(false)

  const loadPosts = useCallback(async () => {
    try {
      const response = await postApi.getFavorites()
      let favoritePosts = response.data || []

      if (searchHashtag?.trim()) {
        const hashtagLower = searchHashtag.trim().toLowerCase()
        favoritePosts = favoritePosts.filter(
          (post) =>
            post.hashtag?.toLowerCase().includes(hashtagLower) ||
            post.description?.toLowerCase().includes(hashtagLower)
        )
      }

      if (statusFilter) {
        favoritePosts = favoritePosts.filter(
          (post) => post.status === statusFilter
        )
      }

      setPosts(favoritePosts)
      const ids = new Set(favoritePosts.map((post) => post.id))
      setFavoritePostIds(ids)
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [searchHashtag, statusFilter])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadPosts()
  }, [loadPosts])

  const handleFavoriteToggle = async (post) => {
    if (!post?.id) return

    try {
      const isFavorite = favoritePostIds.has(post.id)
      if (isFavorite) {
        await postApi.removeFavorite(post.id)
        const newSet = new Set(favoritePostIds)
        newSet.delete(post.id)
        setFavoritePostIds(newSet)
        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== post.id))
      } else {
        await postApi.addFavorite(post.id)
        const newSet = new Set([...favoritePostIds, post.id])
        setFavoritePostIds(newSet)
      }
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    }
  }

  const handlePostPress = useCallback((post) => {
    setSelectedPost(post)
    setScrollToComments(false)
  }, [])

  const handleCommentsPress = useCallback((post) => {
    setSelectedPost(post)
    setScrollToComments(true)
  }, [])

  const handleCloseBottomSheet = useCallback(() => {
    setSelectedPost(null)
    setScrollToComments(false)
  }, [])

  if (loading) {
    return (
      <AppLayout header={null} hasHeader={false}>
        <SavedPostsHeader
          searchValue={searchHashtag}
          onSearchChange={setSearchHashtag}
          onFilterPress={() => setIsFilterVisible(true)}
          isBottomSheetOpen={false}
        />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.green} />
        </View>
      </AppLayout>
    )
  }

  const getPostPhoto = (post) => {
    return post.photos?.[0] || null
  }

  return (
    <AppLayout header={null} hasHeader={false}>
      <SavedPostsHeader
        searchValue={searchHashtag}
        onSearchChange={setSearchHashtag}
        onFilterPress={() => setIsFilterVisible(true)}
        isBottomSheetOpen={!!selectedPost}
      />
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            authorAvatar={item.author?.avatar}
            photo={getPostPhoto(item)}
            isFavorite={favoritePostIds.has(item.id)}
            onPress={() => handlePostPress(item)}
            onContactPress={() => {
              handlePostPress(item)
            }}
            onCommentsPress={() => handleCommentsPress(item)}
            onBookmarkPress={() => handleFavoriteToggle(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.green}
          />
        }
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <AppText>Сохраненных постов пока нет</AppText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {selectedPost && (
        <PostBottomSheet
          post={selectedPost}
          isFavorite={favoritePostIds.has(selectedPost.id)}
          onClose={handleCloseBottomSheet}
          onFavoriteToggle={() => handleFavoriteToggle(selectedPost)}
          onContactPress={() => {
          }}
          scrollToComments={scrollToComments}
        />
      )}

      <FilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
      />
    </AppLayout>
  )
}

export default SavedPostsScreen
