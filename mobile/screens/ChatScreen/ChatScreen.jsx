import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  useMemo,
} from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { io } from 'socket.io-client'
import { chatApi } from '@entities/chatApi/chatApi'
import { colors } from '@assets'
import { AppText } from '@components/AppText/AppText'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'
import AppLayout from '@components/Layout/AppLayout'
import MessageActionBottomSheet from '@components/MessageActionBottomSheet/MessageActionBottomSheet'
import { AuthContext } from '@app/contexts/AuthContext'
import { TextInput } from 'react-native'
import { tokenStorage } from '@utils/tokenStorage'

const ChatScreen = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { chatId, otherUser } = route.params || {}
  const { user: currentUser } = useContext(AuthContext)
  const currentUserId = currentUser?.id || null
  const insets = useSafeAreaInsets()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isMessageActionSheetVisible, setIsMessageActionSheetVisible] =
    useState(false)

  const flatListRef = useRef(null)
  const inputRef = useRef(null)
  const socketRef = useRef(null)

  const messageItems = useMemo(() => {
    if (!messages.length) return []

    const items = []
    let currentDateKey = null

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at)
      const dateKey = `${messageDate.getFullYear()}-${messageDate.getMonth()}-${messageDate.getDate()}`

      if (currentDateKey !== dateKey) {
        items.push({
          type: 'date',
          dateKey,
          date: messageDate,
        })
        currentDateKey = dateKey
      }

      items.push({
        type: 'message',
        message,
      })
    })

    return items
  }, [messages])

  const loadMessages = useCallback(async () => {
    if (!chatId) return

    try {
      const response = await chatApi.getMessages(chatId)
      const msgs = response.data || response || []
      setMessages(msgs)
      
      if (currentUserId) {
        try {
          await chatApi.markMessagesAsRead(chatId)
        } catch {
        }
      }
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [chatId, currentUserId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

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
        socket.emit('join_chat', chatId)
        socket.on('new_message', (incomingMessage) => {
          if (Number(incomingMessage.chat_id) !== Number(chatId)) return
          setMessages((prev) => {
            if (prev.some((item) => Number(item.id) === Number(incomingMessage.id))) {
              return prev
            }
            return [...prev, incomingMessage]
          })
          chatApi.markMessagesAsRead(chatId).catch(() => {})
        })
        socket.on('messages_read', ({ chatId: eventChatId, readerId }) => {
          if (Number(eventChatId) !== Number(chatId)) return
          if (Number(readerId) === Number(currentUserId)) return
          setMessages((prev) =>
            prev.map((message) => {
              const isMine =
                Number(message.sender_id) === Number(currentUserId)
              if (!isMine) return message
              return { ...message, is_read: 1 }
            })
          )
        })
        socket.on('message_updated', ({ messageId, chatId: eventChatId, text }) => {
          if (Number(eventChatId) !== Number(chatId)) return
          setMessages((prev) =>
            prev.map((message) =>
              Number(message.id) === Number(messageId)
                ? { ...message, text }
                : message
            )
          )
        })
        socket.on('message_deleted', ({ messageId, chatId: eventChatId }) => {
          if (Number(eventChatId) !== Number(chatId)) return
          setMessages((prev) =>
            prev.filter((message) => Number(message.id) !== Number(messageId))
          )
        })
        socket.on('chat_deleted', ({ chatId: eventChatId, deletedForUserId }) => {
          if (Number(eventChatId) !== Number(chatId)) return
          if (Number(deletedForUserId) !== Number(currentUserId)) return
          Alert.alert('Чат удален', 'Чат был удален.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
        })
      } catch {}
    }

    connectSocket()

    return () => {
      mounted = false
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [chatId])

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const formatDate = (date) => {
    const months = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ]

    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()

    return `${day} ${month} ${year} года`
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId || sendingMessage) return

    setSendingMessage(true)
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          chatId,
          text: messageText.trim(),
        })
      } else {
        await chatApi.sendMessage(chatId, messageText.trim())
        loadMessages()
      }
      setMessageText('')
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    } finally {
      setSendingMessage(false)
    }
  }

  const handleMessageLongPress = useCallback((message) => {
    if (!currentUserId) return
    const messageSenderId = Number(message.sender_id)
    const userId = Number(currentUserId)
    if (messageSenderId === userId) {
      setSelectedMessage(message)
      setIsMessageActionSheetVisible(true)
    }
  }, [currentUserId])

  const handleMessageUpdated = useCallback(() => {
    setIsMessageActionSheetVisible(false)
    setSelectedMessage(null)
    loadMessages()
  }, [loadMessages])

  const getAvatarUri = () => {
    if (!otherUser?.other_user_avatar) return null
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    if (otherUser.other_user_avatar.startsWith('http')) {
      return otherUser.other_user_avatar
    }
    return `${baseURL}${otherUser.other_user_avatar}`
  }

  const isMyMessage = (message) => {
    if (!currentUserId || !message.sender_id) return false
    return Number(message.sender_id) === Number(currentUserId)
  }

  const renderMessage = ({ item: message }) => {
    const myMessage = isMyMessage(message)
    const isRead = message.is_read === 1 || message.is_read === true
    
    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          myMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
        onLongPress={() => handleMessageLongPress(message)}
        activeOpacity={myMessage ? 0.7 : 1}
        disabled={!myMessage}
      >
        <View
          style={[
            styles.messageBubble,
            myMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <AppText
            style={[
              styles.messageText,
              myMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {message.text}
          </AppText>
          <View style={styles.messageFooter}>
            <AppText
              style={[
                styles.messageTime,
                myMessage ? styles.myMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatTime(message.created_at)}
            </AppText>
            {myMessage && (
              <Image
                source={
                  isRead
                    ? require('@assets/checkmark-done_chat.png')
                    : require('@assets/checkmark_chat.png')
                }
                style={styles.readIcon}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateHeader}>
          <AppText style={styles.dateHeaderText}>
            {formatDate(item.date)}
          </AppText>
        </View>
      )
    }
    return renderMessage({ item: item.message })
  }

  const avatarUri = getAvatarUri()

  return (
    <AppLayout header={null} hasHeader={false}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.headerContent}>
          <View style={styles.headerUserInfo}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
            ) : (
              <Image
                source={require('@assets/avatar.png')}
                style={styles.headerAvatar}
              />
            )}
            <AppText style={styles.headerUsername}>
              {otherUser?.other_user_name || 'Пользователь'}
            </AppText>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >

        {/* Messages Container */}
        <View style={styles.chatContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.green} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messageItems}
              keyExtractor={(item) =>
                item.type === 'date' ? item.dateKey : `msg-${item.message.id}`
              }
              renderItem={renderItem}
              contentContainerStyle={styles.messagesContent}
              style={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: true })
              }}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Написать сообщение..."
              placeholderTextColor={colors.gray}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true })
                }, 300)
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!messageText.trim() || sendingMessage) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sendingMessage}
            >
              <Image
                source={require('@assets/baidu_send_message.png')}
                style={styles.sendIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <MessageActionBottomSheet
        message={selectedMessage}
        visible={isMessageActionSheetVisible}
        onClose={() => {
          setIsMessageActionSheetVisible(false)
          setSelectedMessage(null)
        }}
        onMessageUpdated={handleMessageUpdated}
      />
    </AppLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.black,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    position: 'relative',
    zIndex: 10,
  },
  headerContent: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: 40,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  headerUsername: {
    fontSize: 16,
    color: colors.white,
    fontFamily: 'Cruinn-Regular',
  },
  chatContainer: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    marginTop: 12,
    flex: 1,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
  },
  messageContainer: {
    marginBottom: 8,
    width: '100%',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  myMessageBubble: {
    backgroundColor: colors.orange,
  },
  otherMessageBubble: {
    backgroundColor: colors.lowGreen,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Cruinn-Regular',
    marginBottom: 4,
  },
  myMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.fullBlack,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Cruinn-Regular',
  },
  myMessageTime: {
    color: colors.white,
    opacity: 0.8,
  },
  otherMessageTime: {
    color: colors.gray,
  },
  readIcon: {
    width: 12,
    height: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lowGreen,
    minHeight: 60,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lowGreen,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
    maxHeight: 100,
    marginRight: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    width: 24,
    height: 24,
  },
})

export default ChatScreen
