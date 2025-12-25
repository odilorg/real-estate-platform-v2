import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#3b82f6' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Вход' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Регистрация' }} />
        <Stack.Screen name="property/[id]" options={{ title: 'Недвижимость' }} />
      </Stack>
    </>
  );
}
