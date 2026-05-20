import { backgrounds, colors } from '@assets/index'
import { AppText } from '@components/AppText/AppText'
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native'
import AppLayout from '@components/Layout/AppLayout'
import { useContext, useEffect, useState } from 'react'
import { Audio } from 'expo-av'
import { userApi } from '@entities/userApi/userApi'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'
import { AuthContext } from '@app/contexts/AuthContext'
import EditUserBottomSheet from '@components/EditUserBottomSheet/EditUserBottomSheet'

const ProfileScreen = ({ navigation }) => {
  const [isExiting, setIsExiting] = useState(false)
  const [profile, setProfile] = useState(null)
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false)
  const { logout } = useContext(AuthContext)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await userApi.getProfile()
        setProfile(data)
      } catch (e) {
        Alert.alert('Ошибка', getServerErrorMessage(e))
      }
    }

    loadProfile()
  }, [])

  const handleExit = async () => {
    setIsExiting(true)

    const sounds = [
      require('@assets/exit-sound-1.mp3'),
      require('@assets/exit-sound-2.mp3'),
    ]
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)]
    const { sound } = await Audio.Sound.createAsync(randomSound)

    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        sound.unloadAsync()
        await logout()
      }
    })

    await sound.playAsync()
  }

  return (
    <AppLayout background={backgrounds.hourglassProfile} scroll={false}>
      <View style={styles.content}>
        <View style={styles.userCard}>
          {/* Аватар */}
          <View style={styles.avatarContainer}>
            {profile?.data?.user?.avatar ? (
              <Image
                source={{
                  uri: `${
                    process.env.EXPO_PUBLIC_IP_CONFIG || 'http://localhost:3000'
                  }${profile.data.user.avatar}`,
                }}
                style={styles.avatarImage}
                defaultSource={require('@assets/avatar.png')}
              />
            ) : (
              <Image
                source={require('@assets/avatar.png')}
                style={styles.avatarImage}
              />
            )}
          </View>

          {/* Информация о пользователе */}
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <View style={styles.userNameContainer}>
                <View style={styles.userNameBorder}>
                  <AppText
                    style={styles.userName}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {profile?.data?.user?.name || 'Имя пользователя'}
                  </AppText>
                  <View style={styles.userNameLabelContainer}>
                    <AppText style={styles.userNameLabel}>
                      Имя пользователя
                    </AppText>
                  </View>
                </View>
              </View>
              <View style={styles.rightSection}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditSheetVisible(true)}
                >
                  <Image
                    source={require('@assets/write.png')}
                    style={styles.editIcon}
                  />
                </TouchableOpacity>

                {/* Декоративные элементы */}
                {/* <View style={styles.badges}>
                  <Image
                    source={require('@assets/baiduOrange.png')}
                    style={styles.badgeOrange}
                  />
                  <Image
                    source={require('@assets/baiduGreen.png')}
                    style={styles.badgeGreen}
                  />
                </View> */}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.additionalInfo}>
          <View style={styles.additionalContent}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation?.navigate('SavedPosts')}
            >
              <AppText fontFamily="Unbounded-Regular" style={styles.actionText}>
                Сохраненные посты
              </AppText>

              <Image
                source={require('@assets/bookmark.png')}
                style={styles.actionIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation?.navigate('MyPosts')}
            >
              <AppText fontFamily="Unbounded-Regular" style={styles.actionText}>
                Мои объявления
              </AppText>

              <Image
                source={require('@assets/log.png')}
                style={styles.actionIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleExit}
              disabled={isExiting}
            >
              <AppText fontFamily="Unbounded-Regular" style={styles.actionText}>
                Выйти
              </AppText>

              <Image
                source={
                  isExiting
                    ? require('@assets/dogActive.png')
                    : require('@assets/dogInactive.png')
                }
                style={styles.actionIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <EditUserBottomSheet
        user={profile?.data?.user}
        visible={isEditSheetVisible}
        onClose={() => setIsEditSheetVisible(false)}
        onSaved={async () => {
          setIsEditSheetVisible(false)
          try {
            const data = await userApi.getProfile()
            setProfile(data)
          } catch (e) {}
        }}
      />
    </AppLayout>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
  },

  userCard: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: 20,
    marginTop: 20,
    flexDirection: 'row',
    paddingVertical: Platform.OS === 'ios' ? 24 : 20,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 20,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    minHeight: Platform.OS === 'ios' ? 120 : 100,
  },

  avatarContainer: {
    marginRight: Platform.OS === 'ios' ? 12 : 16,
  },

  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.lowGreen,
  },

  userInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 110 : 100,
  },

  userNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  userNameContainer: {
    flex: 1,
    marginRight: Platform.OS === 'ios' ? 8 : 12,
    minWidth: Platform.OS === 'ios' ? 0 : undefined,
  },

  rightSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: Platform.OS === 'ios' ? 50 : undefined,
  },

  userNameBorder: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.green,
    paddingHorizontal: Platform.OS === 'ios' ? 12 : 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    minHeight: Platform.OS === 'ios' ? 56 : 48,
    justifyContent: 'center',
    backgroundColor: colors.white,
    position: 'relative',
  },

  userName: {
    fontSize: 16,
    color: colors.fullBlack,
    fontFamily: 'Cruinn-Regular',
    lineHeight: 20,
    paddingRight: Platform.OS === 'ios' ? 60 : 80,
  },

  userNameLabelContainer: {
    position: 'absolute',
    bottom: -8,
    right: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  userNameLabel: {
    fontSize: 10,
    color: colors.gray,
    fontFamily: 'Cruinn-Regular',
  },

  editButton: {
    padding: 0,
    marginBottom: 5,
    top: 15,
    right: 15,
  },

  editIcon: {
    width: 20,
    height: 20,
  },

  badges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },

  badgeOrange: {
    top: Platform.OS === 'ios' ? 40 : 30,
    right: 40,
  },

  badgeGreen: {},

  additionalInfo: {
    width: '90%',
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  additionalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 40,
    paddingVertical: 11,
    paddingLeft: 20,
    paddingRight: 12,
    backgroundColor: colors.white,

    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },

    elevation: 3,
  },

  actionText: {
    paddingRight: 12,
  },

  actionIcon: {
    marginLeft: 12,
    width: 24,
    height: 24,
  },

  petsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

export default ProfileScreen
