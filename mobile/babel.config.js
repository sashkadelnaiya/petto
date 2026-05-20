module.exports = function (api) {
  api.cache(true)

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@app': './app',
            '@assets': './assets',
            '@components': './components',
            '@entities': './entities',
            '@hooks': './hooks',
            '@screens': './screens',
            '@utils': './utils',
            '@routers': './app/routers',
            '@contexts': './app/contexts',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
