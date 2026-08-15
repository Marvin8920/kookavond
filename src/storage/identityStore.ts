import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LocalIdentities } from '../types';

const KEY = 'kookavond:identities:v1';

export async function loadIdentities(): Promise<LocalIdentities> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as LocalIdentities;
  } catch {
    return {};
  }
}

export async function saveIdentities(identities: LocalIdentities): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(identities));
}
