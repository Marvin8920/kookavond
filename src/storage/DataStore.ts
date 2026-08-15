import type { KookavondData } from './schema';

/**
 * Sync-laag tussen de app en waar de data daadwerkelijk leeft.
 *
 * Voor v1 is dat 1 lokale blob in AsyncStorage (zie AsyncStorageDataStore).
 * Alle business logic (src/logic, src/context/DataContext) werkt puur op het
 * in-memory KookavondData object en weet niets van AsyncStorage — dus om
 * later te synchroniseren tussen telefoons via bv. Supabase hoeft alleen
 * deze interface opnieuw geïmplementeerd te worden (load = ophalen + realtime
 * subscription, save = upsert naar de juiste tabellen). De rest van de app
 * blijft ongewijzigd.
 */
export interface DataStore {
  load(): Promise<KookavondData>;
  save(data: KookavondData): Promise<void>;
}
