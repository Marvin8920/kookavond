import * as Linking from 'expo-linking';

import type { Group } from '../types';

export function buildInviteLink(group: Group): string {
  return Linking.createURL('/group/join', { queryParams: { code: group.inviteCode } });
}

export function buildInviteMessage(group: Group): string {
  const link = buildInviteLink(group);
  return `Doe mee met onze kookgroep "${group.name}" in Kookavond!\n\n${link}\n\nOf voer handmatig de code ${group.inviteCode} in bij "Groep joinen met code".`;
}
