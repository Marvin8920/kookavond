import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { colors, spacing } from '../../../src/constants/theme';
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
      <Stack.Screen
        name="index"
        options={{
          title: group?.name ?? 'Groep',
          headerLeft: () => (
            <Pressable onPress={() => router.replace('/')} hitSlop={12} style={{ paddingRight: spacing.md }}>
              <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '600' }}>‹</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="members" options={{ title: 'Leden' }} />
      <Stack.Screen name="history" options={{ title: 'Geschiedenis' }} />
      <Stack.Screen name="poll/new" options={{ title: 'Kookavond voorstellen', presentation: 'modal' }} />
      <Stack.Screen name="poll/[eventId]" options={{ title: 'Datumprikker' }} />
      <Stack.Screen name="event/[eventId]" options={{ title: 'Kookavond' }} />
    </Stack>
  );
}
