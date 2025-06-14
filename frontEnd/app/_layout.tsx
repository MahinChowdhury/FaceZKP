import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppKit } from './config/appkit';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="index"
          options={{
            title: 'Login',
          }}
        />
        <Stack.Screen 
          name="register"
          options={{
            title: 'Create Account',
          }}
        />
      </Stack>
      <AppKit />
    </SafeAreaProvider>
  );
} 