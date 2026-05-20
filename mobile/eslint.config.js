import react from 'eslint-plugin-react'
import reactNative from 'eslint-plugin-react-native'

export default [
  {
    files: ['**/*.{js,jsx}'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        require: 'readonly',
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        FormData: 'readonly',
      },
    },

    plugins: {
      react,
      'react-native': reactNative,
    },

    rules: {
      'no-undef': 'error',
      'no-unused-vars': [
        'warn',
        { vars: 'all', args: 'after-used', ignoreRestSiblings: true },
      ],
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/react-in-jsx-scope': 'off',
    },

    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]
