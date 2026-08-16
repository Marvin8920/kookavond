import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import type { Group } from '../types';

/** Moet gelijk blijven aan expo.experiments.baseUrl in app.json. */
const WEB_BASE_PATH = '/kookavond';

export function buildInviteLink(group: Group): string {
  if (Platform.OS === 'web') {
    // expo-linking kent het GitHub Pages subpad niet, dus die zetten we er hier zelf voor.
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}${WEB_BASE_PATH}/group/join?code=${encodeURIComponent(group.inviteCode)}`;
  }
  return Linking.createURL('/group/join', { queryParams: { code: group.inviteCode } });
}

export function buildInviteMessage(group: Group): string {
  const link = buildInviteLink(group);
  return `Doe mee met onze kookgroep "${group.name}" in Kookavond!\n\n${link}\n\nOf voer handmatig de code ${group.inviteCode} in bij "Groep joinen met code".`;
}
