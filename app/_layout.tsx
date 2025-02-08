import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const headerLeft = () => (
    <TouchableOpacity 
      onPress={() => router.back()}
      style={{ marginLeft: 16 }}
    >
      <Ionicons name="close-circle" size={28} color="#666" />
    </TouchableOpacity>
  );

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen 
            name="edit-contact" 
            options={{
              title: '编辑联系人',
              headerShown: true,
              presentation: 'modal',
              headerLeft,
              headerStyle: {
                backgroundColor: '#fff',
              },
              headerTitleStyle: {
                color: '#000',
                fontSize: 18,
                fontWeight: 'bold',
              },
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="add-contact" 
            options={{
              title: '添加联系人',
              headerShown: true,
              presentation: 'modal',
              headerLeft,
              headerStyle: {
                backgroundColor: '#fff',
              },
              headerTitleStyle: {
                color: '#000',
                fontSize: 18,
                fontWeight: 'bold',
              },
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaView>
    </ThemeProvider>
  );
}
