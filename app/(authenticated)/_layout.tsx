import { useConvexAuth } from 'convex/react';
import { Redirect, Stack, useRootNavigationState } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { PAYMENT_SYSTEM_ENABLED } from '@/config/appConfig';
import { palette } from '@/constants/Colors';
import { useRevenueCat } from '@/contexts/RevenueCatContext';

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isPremium, isLoading: isRevenueCatLoading } = useRevenueCat();
  const navigationState = useRootNavigationState();

  const loadingView = (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F4F5F7',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="large" color={palette.primary} />
    </View>
  );

  if (!navigationState?.key) {
    return loadingView;
  }
  if (isLoading || isRevenueCatLoading) {
    return loadingView;
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  if (PAYMENT_SYSTEM_ENABLED && !isPremium) {
    return <Redirect href="/(auth)/paywall" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F4F5F7' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="license" />
      <Stack.Screen name="practice" />
      <Stack.Screen name="quiz" options={{ gestureEnabled: false }} />
      <Stack.Screen name="results" options={{ gestureEnabled: false }} />
      <Stack.Screen name="stats" />
      <Stack.Screen name="history" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
