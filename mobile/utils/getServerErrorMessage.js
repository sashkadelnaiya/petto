import { serverErrorMap } from './serverErrorI18n'

export const getServerErrorMessage = (error) => {
  const serverCode = error?.response?.data?.code || error?.response?.data?.error

  if (serverCode && serverErrorMap[serverCode]) {
    return serverErrorMap[serverCode]
  }

  return 'Произошла ошибка. Попробуйте позже'
}
