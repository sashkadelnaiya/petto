import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import { useContext } from 'react'
import { AuthContext } from '@app/contexts/AuthContext'

const ChatListItem = ({ chat, onPress, onLongPress }) => {
  const { width: screenWidth } = useWindowDimensions()
  const { user: currentUser } = useContext(AuthContext)
  const currentUserId = currentUser?.id || null

  const getAvatarUri = () => {
    if (!chat.other_user_avatar) return null
    const baseURL = process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
    if (chat.other_user_avatar.startsWith('http')) {
      return chat.other_user_avatar
    }
    return `${baseURL}${chat.other_user_avatar}`
  }

  const getStatusIcon = () => {
    if (!chat.last_message_sender_id || !currentUserId) return null

    const lastSenderId = Number(chat.last_message_sender_id)
    const userId = Number(currentUserId)

    if (lastSenderId !== userId) {
      const unreadCount = chat.unread_count || 0
      if (unreadCount > 0) {
        return require('@assets/ellipse_chat.png')
      }
      return null
    }

    const isRead = chat.last_message_read === 1 || chat.last_message_read === true
    if (isRead) {
      return require('@assets/checkmark-done_chat.png')
    }
    return require('@assets/checkmark_chat.png')
  }

  const statusIcon = getStatusIcon()
  const avatarUri = getAvatarUri()

  const messageText = chat.last_message_text || ''
  const needsFade = messageText.length > 40

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <Image
              source={require('@assets/avatar.png')}
              style={styles.avatar}
            />
          )}
        </View>

        {/* User info and message */}
        <View style={styles.textContainer}>
          <AppText style={styles.username} numberOfLines={1}>
            {chat.other_user_name || 'Пользователь'}
          </AppText>
          {messageText ? (
            <View style={styles.messageContainer}>
              <View style={styles.messageWithFade}>
                <AppText style={styles.messageText} numberOfLines={1}>
                  {messageText}
                </AppText>
                {needsFade && (
                  <LinearGradient
                    colors={['transparent', colors.white]}
                    start={{ x: 0.7, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.fadeGradient}
                  />
                )}
              </View>
            </View>
          ) : null}
        </View>

        {/* Status icon */}
        {statusIcon && (
          <View style={styles.statusContainer}>
            <Image source={statusIcon} style={styles.statusIcon} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lowGreen,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    width: '90%',
    alignSelf: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
    marginBottom: 4,
  },
  messageContainer: {
    position: 'relative',
  },
  messageWithFade: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
    flex: 1,
  },
  fadeGradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
  },
  statusContainer: {
    marginLeft: 'auto',
  },
  statusIcon: {
    width: 16,
    height: 16,
  },
})

export default ChatListItem
