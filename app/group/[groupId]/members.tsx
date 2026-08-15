import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, Text, View } from 'react-native';

import { Card } from '../../../src/components/Card';
import { Screen } from '../../../src/components/Screen';
import { colors, spacing, typography } from '../../../src/constants/theme';
import { useData } from '../../../src/context/DataContext';

export default function MembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { getGroup, getMembers, getMyMemberId } = useData();
  const group = getGroup(groupId);
  const members = getMembers(groupId);
  const myId = getMyMemberId(groupId);

  return (
    <Screen scroll={false}>
      <Text style={typography.muted}>{members.length} leden · code {group?.inviteCode}</Text>
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={typography.body}>{item.name}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {item.id === group?.organizerMemberId ? (
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>ORGANISATOR</Text>
                ) : null}
                {item.id === myId ? <Text style={typography.muted}>(jij)</Text> : null}
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
