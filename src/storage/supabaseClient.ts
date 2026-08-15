import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL en EXPO_PUBLIC_SUPABASE_ANON_KEY moeten gezet zijn.');
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
