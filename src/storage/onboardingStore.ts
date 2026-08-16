import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'kookavond:onboarding-seen:v1';

export async function hasSeenOnboarding(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw === 'true';
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}
