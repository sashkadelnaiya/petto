import { useEffect, useState, useCallback, useRef, useContext } from 'react'
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { chatApi } from '@entities/chatApi/chatApi'
import { colors } from '@assets'
import { AppText } from '@components/AppText/AppText'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'
import AppLayout from '@components/Layout/AppLayout'
import ChatListItem from '@components/ChatListItem/ChatListItem'
import ChatActionBottomSheet from '@components/ChatActionBottomSheet/ChatActionBottomSheet'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { TextInputField } from '@components/TextInputField/TextInputField'
import { io } from 'socket.io-client'
import { tokenStorage } from '@utils/tokenStorage'
import { AuthContext } from '@app/contexts/AuthContext'

const ChatListScreen = () => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchUsername, setSearchUsername] = useState('')
  const [selectedChat, setSelectedChat] = useState(null)
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false)
  const [allChats, setAllChats] = useState([])
  const { user: currentUser } = useContext(AuthContext)
  const currentUserId = currentUser?.id || null
  const navigation = useNavigation()
  const socketRef = useRef(null)

  const loadChats = useCallback(async () => {
    try {
      const response = await chatApi.getUserChats()
      let userChats = response.data || response || []
      setAllChats(userChats)
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!searchUsername?.trim()) {
      setChats(allChats)
      return
    }
    const usernameLower = searchUsername.trim().toLowerCase()
    setChats(
      allChats.filter((chat) =>
        chat.other_user_name?.toLowerCase().includes(usernameLower)
      )
    )
  }, [allChats, searchUsername])

  useEffect(() => {
    let mounted = true
    const connectSocket = async () => {
      try {
        const token = await tokenStorage.getAccessToken()
        if (!token || !mounted) return
        const socket = io(
          process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000',
          {
            auth: { token },
          }
        )
        socketRef.current = socket
        socket.on('connect', () => {
          setAllChats((prev) => {
            prev.forEach((chat) => socket.emit('join_chat', chat.id))
            return prev
          })
        })

        socket.on('new_message', (incoming) => {
          setAllChats((prev) => {
            const idx = prev.findIndex(
              (chat) => Number(chat.id) === Number(incoming.chat_id)
            )
            if (idx < 0) return prev
            const updated = [...prev]
            const current = updated[idx]
            const mine =
              currentUserId != null &&
              Number(incoming.sender_id) === Number(currentUserId)
            updated[idx] = {
              ...current,
              last_message_text: incoming.text,
              last_message_sender_id: incoming.sender_id,
              last_message_read: mine ? 0 : current.last_message_read,
              unread_count: mine
                ? current.unread_count
                : (Number(current.unread_count) || 0) + 1,
            }
            const [item] = updated.splice(idx, 1)
            updated.unshift(item)
            return updated
          })
        })

        socket.on('messages_read', ({ chatId, readerId }) => {
          setAllChats((prev) =>
            prev.map((chat) => {
              if (Number(chat.id) !== Number(chatId)) return chat
              const lastMine =
                currentUserId != null &&
                Number(chat.last_message_sender_id) === Number(currentUserId)
              if (lastMine) {
                return { ...chat, last_message_read: 1 }
              }
              if (Number(readerId) === Number(currentUserId)) {
                return { ...chat, unread_count: 0 }
              }
              return chat
            })
          )
        })
        socket.on('message_updated', ({ chatId, text }) => {
          setAllChats((prev) =>
            prev.map((chat) =>
              Number(chat.id) === Number(chatId)
                ? { ...chat, last_message_text: text }
                : chat
            )
          )
        })
        socket.on('message_deleted', async () => {
          try {
            const response = await chatApi.getUserChats()
            setAllChats(response.data || response || [])
          } catch {}
        })
        socket.on('chat_deleted', ({ chatId, deletedForUserId }) => {
          if (Number(deletedForUserId) !== Number(currentUserId)) return
          setAllChats((prev) =>
            prev.filter((chat) => Number(chat.id) !== Number(chatId))
          )
        })
      } catch {}
    }
    connectSocket()
    return () => {
      mounted = false
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [currentUserId])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    allChats.forEach((chat) => socket.emit('join_chat', chat.id))
  }, [allChats])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  useFocusEffect(
    useCallback(() => {
      loadChats()
    }, [loadChats])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadChats()
  }, [loadChats])

  const handleChatPress = useCallback(
    (chat) => {
      navigation.navigate('Chat', {
        screen: 'ChatDetail',
        params: {
          chatId: chat.id,
          otherUser: {
            other_user_name: chat.other_user_name,
            other_user_avatar: chat.other_user_avatar,
          },
        },
      })
    },
    [navigation]
  )

  const handleLongPress = useCallback((chat) => {
    setSelectedChat(chat)
    setIsActionSheetVisible(true)
  }, [])

  const handleChatDeleted = useCallback(() => {
    setIsActionSheetVisible(false)
    setSelectedChat(null)
    setRefreshing(true)
    loadChats()
  }, [loadChats])

  if (loading) {
    return (
      <AppLayout header={null} hasHeader={false}>
        <ChatListHeader
          searchValue={searchUsername}
          onSearchChange={setSearchUsername}
          isBottomSheetOpen={false}
        />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.green} />
        </View>
      </AppLayout>
    )
  }

  return (
    <AppLayout header={null} hasHeader={false}>
      <ChatListHeader
        searchValue={searchUsername}
        onSearchChange={setSearchUsername}
        isBottomSheetOpen={isActionSheetVisible}
      />
      <View style={styles.chatsContainer}>
        <FlatList
          data={chats}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ChatListItem
              chat={item}
              onPress={() => handleChatPress(item)}
              onLongPress={() => handleLongPress(item)}
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
              <AppText>Чатов пока нет</AppText>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      <ChatActionBottomSheet
        chat={selectedChat}
        visible={isActionSheetVisible}
        onClose={() => {
          setIsActionSheetVisible(false)
          setSelectedChat(null)
        }}
        onDeleted={handleChatDeleted}
      />
    </AppLayout>
  )
}

const ChatListHeader = ({ searchValue, onSearchChange, isBottomSheetOpen }) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const insets = useSafeAreaInsets()

  const handleSearchPress = () => {
    if (isSearchVisible) {
      onSearchChange?.('')
    }
    setIsSearchVisible(!isSearchVisible)
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 10,
            zIndex: isBottomSheetOpen ? undefined : 10,
          },
        ]}
      >
        {isSearchVisible && (
          <View style={styles.searchRow}>
            <TextInputField
              placeholder="Поиск по имени пользователя..."
              placeholderTextColor={colors.gray}
              value={searchValue}
              onChangeText={onSearchChange}
              style={styles.searchInput}
              autoFocus
            />
          </View>
        )}

        <View
          style={[
            styles.actionRow,
            isSearchVisible && { marginTop: 12, top: 0 },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSearchPress}
          >
            <Image source={require('@assets/search.png')} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    position: 'relative',
  },
  chatsContainer: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    marginTop: 12,
    flex: 1,
    overflow: 'hidden',
  },
  searchRow: {
    marginTop: 16,
    paddingHorizontal: 60,
  },
  searchInput: {
    marginBottom: 0,
    borderColor: colors.green,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 60,
    top: 40,
  },
  actionButton: {},
})

export default ChatListScreen
