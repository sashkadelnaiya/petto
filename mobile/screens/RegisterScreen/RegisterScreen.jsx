import { AuthContext } from '@app/contexts/AuthContext'
import { backgrounds, colors } from '@assets/index'
import { ButtonPrimary } from '@components/ButtonPrimary/ButtonPrimary'
import { Loader } from '@components/Loader/Loader'
import { TextInputField } from '@components/TextInputField/TextInputField'
import { Asset } from 'expo-asset'
import { useContext, useEffect, useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { AppText } from '@components/AppText/AppText'
import { getServerErrorMessage } from '@utils/getServerErrorMessage'
import { SafeAreaView } from 'react-native-safe-area-context'

const RegisterScreen = () => {
  const [ready, setReady] = useState(false)
  const { register } = useContext(AuthContext)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = watch('password')

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
      await register(data.name, data.email, data.password)
    } catch (e) {
      Alert.alert('Ошибка', getServerErrorMessage(e))
    }
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
            {/* NAME */}
            <Controller
              control={control}
              name="name"
              rules={{
                required: 'Имя обязательно',
                minLength: {
                  value: 2,
                  message: 'Имя должно быть минимум 2 символа',
                },
              }}
              render={({ field: { value, onChange } }) => (
                <TextInputField
                  placeholder="Логин"
                  placeholderTextColor={colors.gray}
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                />
              )}
            />
            {errors.name && (
              <AppText style={styles.errorText}>{errors.name.message}</AppText>
            )}

            {/* EMAIL */}
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

            {/* PASSWORD */}
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Пароль обязателен',
                minLength: {
                  value: 6,
                  message: 'Пароль минимум 6 символов',
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

            {/* CONFIRM PASSWORD */}
            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: 'Повторите пароль',
                validate: (value) =>
                  value === passwordValue || 'Пароли не совпадают',
              }}
              render={({ field: { value, onChange } }) => (
                <TextInputField
                  placeholder="Повторите пароль"
                  placeholderTextColor={colors.gray}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoCapitalize="none"
                />
              )}
            />
            {errors.confirmPassword && (
              <AppText style={styles.errorText}>
                {errors.confirmPassword.message}
              </AppText>
            )}

            <ButtonPrimary
              title="Зарегестрироваться"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
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
    gap: 14,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -6,
  },
})

export default RegisterScreen
