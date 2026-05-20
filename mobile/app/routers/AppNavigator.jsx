import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { CommonActions } from '@react-navigation/native'
import { Image, Platform } from 'react-native'

import ProfileScreen from '@screens/ProfileScreen/ProfileScreen'
import { colors } from '@assets'
import PostsScreen from '@screens/PostsScreen/PostsScreen'
import CreatePostScreen from '@screens/CreatePostScreen/CreatePostScreen'
import SavedPostsScreen from '@screens/SavedPostsScreen/SavedPostsScreen'
import MyPostsScreen from '@screens/MyPostsScreen/MyPostsScreen'
import ChatListScreen from '@screens/ChatListScreen/ChatListScreen'
import ChatScreen from '@screens/ChatScreen/ChatScreen'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

export default function AppNavigator() {
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 20,
          backgroundColor: colors.black,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
          height: Platform.OS === 'android' ? 70 + insets.bottom : 70,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Posts"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('@assets/focused_baidu.png')
                  : require('@assets/baidu.png')
              }
            />
          ),
        }}
      >
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PostsList" component={PostsScreen} />
            <Stack.Screen
              name="CreatePost"
              component={CreatePostScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('@assets/chat_icon_active.png')
                  : require('@assets/chat_icon.png')
              }
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState()
            const chatTabState = state.routes.find((r) => r.name === 'Chat')
            if (chatTabState && chatTabState.state) {
              const chatStackState = chatTabState.state
              if (
                chatStackState.routes &&
                chatStackState.routes[chatStackState.index]?.name !== 'ChatList'
              ) {
                e.preventDefault()
                const chatTabIndex = state.routes.findIndex(
                  (r) => r.name === 'Chat'
                )
                navigation.dispatch(
                  CommonActions.reset({
                    index: chatTabIndex,
                    routes: state.routes.map((route) => {
                      if (route.name === 'Chat') {
                        return {
                          ...route,
                          state: {
                            routes: [{ name: 'ChatList' }],
                            index: 0,
                          },
                        }
                      }
                      return route
                    }),
                  })
                )
              }
            }
          },
        })}
      >
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen
              name="ChatDetail"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('@assets/focused_home.png')
                  : require('@assets/home.png')
              }
            />
          ),
        }}
      >
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen
              name="SavedPosts"
              component={SavedPostsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MyPosts"
              component={MyPostsScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  )
}
