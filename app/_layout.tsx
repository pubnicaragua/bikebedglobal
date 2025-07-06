import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import '../src/i18n';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(host)" />
        <Stack.Screen name="accommodation/[id]" />
        <Stack.Screen name="route/[id]" />
        <Stack.Screen name="booking/create" />
        <Stack.Screen name="chat/index" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="routes/[id]" />
        <Stack.Screen name="payHistory/[id]" />
      </Stack>
      <StatusBar style="light" backgroundColor="#111827" />
    </>
  );
}