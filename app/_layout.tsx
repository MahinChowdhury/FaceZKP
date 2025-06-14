import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false, // Hide header for custom design
        }}
      >
        <Stack.Screen 
          name="index"
          options={{
            title: 'Create Account',
          }}
        />
      </Stack>
    </>
  );
}