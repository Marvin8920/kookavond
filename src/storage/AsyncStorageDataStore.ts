import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DataStore } from './DataStore';
import { emptyData, STORAGE_KEY, type KookavondData } from './schema';

export class AsyncStorageDataStore implements DataStore {
  async load(): Promise<KookavondData> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    try {
      const parsed = JSON.parse(raw) as Partial<KookavondData>;
      return { ...emptyData(), ...parsed };
    } catch {
      return emptyData();
    }
  }

  async save(data: KookavondData): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
