import { useState, useContext, useEffect } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native'
import { Asset } from 'expo-asset'
import { AuthContext } from '@app/contexts/AuthContext'
import { backgrounds, colors } from '@assets/index'
import { Loader } from '@components/Loader/Loader'
import { TextInputField } from '@components/TextInputField/TextInputField'
import { ButtonPrimary } from '@components/ButtonPrimary/ButtonPrimary'
import { AppText } from '@components/AppText/AppText'
import { useForm, Controller } from 'react-hook-form'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'
import { SafeAreaView } from 'react-native-safe-area-context'

const LoginScreen = ({ navigation }) => {
  const [ready, setReady] = useState(false)
  const { login } = useContext(AuthContext)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    Asset.fromModule(backgrounds.hourglass)
      .downloadAsync()
      .then(() => {
        setReady(true)
      })
  }, [])

  if (!ready) {
    return <Loader />
  }

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password)
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    }
  }

  const handleCreateAccount = () => {
    navigation.navigate('Register')
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={backgrounds.hourglass}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
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
              render={({ field: { value, onChange } }) => (
                <TextInputField
                  placeholder="Email"
                  placeholderTextColor={colors.gray}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />
            {errors.email && (
              <AppText style={styles.errorText}>{errors.email.message}</AppText>
            )}

            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Пароль обязателен',
                minLength: {
                  value: 6,
                  message: 'Пароль должен быть не меньше 6 символов',
                },
              }}
              render={({ field: { value, onChange } }) => (
                <TextInputField
                  placeholder="Пароль"
                  placeholderTextColor={colors.gray}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}
            />
            {errors.password && (
              <AppText style={styles.errorText}>
                {errors.password.message}
              </AppText>
            )}

            {/* <View style={styles.forgotPasswordContainer}>
              <AppText style={styles.forgotPasswordText}>
                Забыли пароль?{' '}
              </AppText>
              <TouchableOpacity onPress={handleForgotPassword}>
                <AppText style={styles.forgotPasswordLink}>
                  Нажмите сюда
                </AppText>
              </TouchableOpacity>
            </View> */}

            <ButtonPrimary
              title="Войти"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <AppText style={styles.dividerText}>или</AppText>
              <View style={styles.dividerLine} />
            </View>

            <ButtonPrimary
              title="Создать аккаунт"
              onPress={handleCreateAccount}
              style={{ backgroundColor: colors.green }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.fullBlack,
    fontSize: 14,
  },
  forgotPasswordLink: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.white,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: colors.fullBlack,
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
})

export default LoginScreen
