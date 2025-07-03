import { Stack } from 'expo-router';

export default function HostLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="accommodations" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name ="bike"/>
    </Stack>
  );
}