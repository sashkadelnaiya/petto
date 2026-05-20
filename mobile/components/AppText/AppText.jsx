import { colors } from '@assets/index'
import { Text, StyleSheet } from 'react-native'

export const AppText = ({ style, children, fontFamily, ...props }) => {
  return (
    <Text
      style={[styles.text, fontFamily ? { fontFamily } : {}, style]}
      {...props}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Cruinn-Regular',
    color: colors.fullBlack,
    fontSize: 14,
  },
})
