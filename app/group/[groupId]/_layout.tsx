import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { colors } from '../../../src/constants/theme';
import { useData } from '../../../src/context/DataContext';

export default function GroupLayout() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { getGroup } = useData();
  const group = getGroup(groupId);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: group?.name ?? 'Groep' }} />
      <Stack.Screen name="members" options={{ title: 'Leden' }} />
      <Stack.Screen name="history" options={{ title: 'Geschiedenis' }} />
      <Stack.Screen name="poll/new" options={{ title: 'Kookavond voorstellen', presentation: 'modal' }} />
      <Stack.Screen name="poll/[eventId]" options={{ title: 'Datumprikker' }} />
      <Stack.Screen name="event/[eventId]" options={{ title: 'Kookavond' }} />
    </Stack>
  );
}
