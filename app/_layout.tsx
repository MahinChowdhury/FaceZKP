import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
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
    </>
  );
}