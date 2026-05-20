import FeedRoute from '@components/FeedRoute/FeedRoute'
import AnimateHeader from '@components/Layout/AnimateHeader'
import AppLayout from '@components/Layout/AppLayout'
import MapRoute from '@components/MapRoute/MapRoute'
import PostBottomSheet from '@components/PostBottomSheet/PostBottomSheet'
import FilterBottomSheet from '@components/FilterBottomSheet/FilterBottomSheet'
import { useState, useCallback } from 'react'
import { useWindowDimensions, Alert } from 'react-native'
import { TabView } from 'react-native-tab-view'
import { postApi } from '@entities/postApi/postApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'

const PostsScreen = ({ navigation }) => {
  const layout = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const [routes] = useState([
    { key: 'feed', title: 'Лента' },
    { key: 'map', title: 'Карта' },
  ])

  const [selectedPost, setSelectedPost] = useState(null)
  const [scrollToComments, setScrollToComments] = useState(false)
  const [favoritePostIds, setFavoritePostIds] = useState(new Set())
  const [searchHashtag, setSearchHashtag] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [isFilterVisible, setIsFilterVisible] = useState(false)

  const onPostAddPressHandler = () => {
    navigation.navigate('CreatePost')
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

  const handleFavoriteToggle = useCallback(
    async (post) => {
      if (!post?.id) return

      try {
        const isFavorite = favoritePostIds.has(post.id)
        if (isFavorite) {
          await postApi.removeFavorite(post.id)
          setFavoritePostIds((prev) => {
            const newSet = new Set(prev)
            newSet.delete(post.id)
            return newSet
          })
        } else {
          await postApi.addFavorite(post.id)
          setFavoritePostIds((prev) => new Set([...prev, post.id]))
        }
      } catch (e) {
        Alert.alert('Ошибка', getServerErrorMessage(e))
      }
    },
    [favoritePostIds]
  )

  const handleFavoritePostIdsUpdate = useCallback((ids) => {
    setFavoritePostIds(ids)
  }, [])

  const renderScene = useCallback(
    ({ route }) => {
      switch (route.key) {
        case 'feed':
          return (
            <FeedRoute
              onPostPress={handlePostPress}
              onCommentsPress={handleCommentsPress}
              onFavoritePostIdsUpdate={handleFavoritePostIdsUpdate}
              searchHashtag={searchHashtag}
              statusFilter={statusFilter}
            />
          )
        case 'map':
          return (
            <MapRoute
              onPostPress={handlePostPress}
              searchHashtag={searchHashtag}
              statusFilter={statusFilter}
            />
          )
        default:
          return null
      }
    },
    [
      handlePostPress,
      handleCommentsPress,
      handleFavoritePostIdsUpdate,
      searchHashtag,
      statusFilter,
    ]
  )

  return (
    <AppLayout header={null} hasHeader={false}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <AnimateHeader
            activeTab={index}
            onTabChange={setIndex}
            position={props.position}
            onPostAddPress={onPostAddPressHandler}
            searchValue={searchHashtag}
            onSearchChange={setSearchHashtag}
            onFilterPress={() => setIsFilterVisible(true)}
          />
        )}
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

export default PostsScreen
