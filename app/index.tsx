import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { EmptyState } from '../src/components/EmptyState';
import { Screen } from '../src/components/Screen';
import { colors, spacing, typography } from '../src/constants/theme';
import { useData } from '../src/context/DataContext';

export default function HomeScreen() {
  const { loading, myGroups, getMembers } = useData();

  if (loading) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={{ gap: spacing.xs }}>
        <Text style={typography.title}>Kookavond</Text>
        <Text style={typography.muted}>Jouw kookgroepen</Text>
      </View>

      <FlatList
        data={myGroups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ gap: spacing.sm }}
        ListEmptyComponent={
          <EmptyState
            title="Nog geen groepen"
            description="Maak een nieuwe kookgroep aan of sluit je aan met een uitnodigingscode."
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/group/${item.id}`)}>
            <Card>
              <Text style={typography.heading}>{item.name}</Text>
              <Text style={typography.muted}>{getMembers(item.id).length} leden · code {item.inviteCode}</Text>
            </Card>
          </Pressable>
        )}
      />

      <View style={{ gap: spacing.sm }}>
        <Button title="Nieuwe kookgroep" onPress={() => router.push('/group/new')} />
        <Button title="Groep joinen met code" variant="secondary" onPress={() => router.push('/group/join')} />
      </View>
    </Screen>
  );
}
