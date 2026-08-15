import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { spacing, typography } from '../../../src/constants/theme';
import { useData } from '../../../src/context/DataContext';
import { formatDateNl } from '../../../src/logic/format';
import { itemLabel } from '../../../src/types';

export default function HistoryScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { getGroup, getHistory, getMembers, data } = useData();
  const history = getHistory(groupId);
  const members = getMembers(groupId);
  const groupType = getGroup(groupId)?.groupType ?? 'random';

  return (
    <Screen scroll={false}>
      <FlatList
        data={history}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ gap: spacing.sm }}
        ListEmptyComponent={<EmptyState title="Nog geen geschiedenis" description="Eerdere kookavonden verschijnen hier." />}
        renderItem={({ item }) => {
          const assignments = data.courseAssignments.filter((ca) => ca.eventId === item.id);
          return (
            <Pressable onPress={() => router.push(`/group/${groupId}/event/${item.id}`)}>
              <Card>
                <Text style={typography.heading}>{formatDateNl(item.confirmedDate ?? '')}</Text>
                {item.theme ? <Text style={typography.muted}>{item.theme}</Text> : null}
                <View style={{ gap: 2, marginTop: spacing.xs }}>
                  {assignments.map((a) => (
                    <Text key={a.id} style={typography.muted}>
                      {members.find((m) => m.id === a.memberId)?.name ?? '?'} · {itemLabel(groupType, a.course)}
                    </Text>
                  ))}
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
