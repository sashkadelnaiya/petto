import { TextInput, StyleSheet } from 'react-native'
import { colors } from '@assets/index'

export const TextInputField = ({ style, ...props }) => {
  return <TextInput style={[styles.input, style]} {...props} />
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.lowOrange,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Cruinn-Regular',
    marginBottom: 16,
    backgroundColor: colors.white,
    color: colors.fullBlack,
  },
})
