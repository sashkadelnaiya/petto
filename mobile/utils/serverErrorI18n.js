export const serverErrorMap = {
  // AUTH
  INVALID_INPUT: 'Некорректные данные',
  EMAIL_ALREADY_EXISTS: 'Пользователь с таким email уже существует',
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  UNAUTHORIZED: 'Необходима авторизация',
  INVALID_TOKEN: 'Неверный токен',
  REFRESH_TOKEN_REQUIRED: 'Требуется refresh-токен',

  // POSTS
  POST_NOT_FOUND: 'Пост не найден',
  NO_PERMISSION: 'Недостаточно прав',
  STATUS_REQUIRED: 'Не указан статус',
  EVENT_DATE_REQUIRED: 'Не указана дата события',
  ADDRESS_REQUIRED: 'Не указан адрес',
  HASHTAG_REQUIRED: 'Не указан хештег',
  INVALID_LATITUDE: 'Некорректная широта',
  INVALID_LONGITUDE: 'Некорректная долгота',
  STATUS_EMPTY: 'Статус не может быть пустым',
  EVENT_DATE_EMPTY: 'Дата события не может быть пустой',
  ADDRESS_EMPTY: 'Адрес не может быть пустым',
  HASHTAG_EMPTY: 'Хештег не может быть пустым',

  // PHOTOS
  NO_FILES_UPLOADED: 'Файлы не загружены',
  PHOTO_NOT_FOUND: 'Фото не найдено',
  FILE_REQUIRED: 'Файл обязателен',
  NO_FILE_UPLOADED: 'Файл не загружен',

  // USERS
  USER_NOT_FOUND: 'Пользователь не найден',
  INVALID_PASSWORD: 'Неверный пароль',
  MISSING_PASSWORD: 'Не указан пароль',

  // FAVORITES
  FAVORITE_ALREADY_EXISTS: 'Пост уже в избранном',

  // COMMENTS
  COMMENT_EMPTY: 'Комментарий не может быть пустым',

  // MESSAGES / CHAT
  MESSAGE_EMPTY: 'Сообщение не может быть пустым',

  // COMMON
  SERVER_ERROR: 'Ошибка сервера',
}
