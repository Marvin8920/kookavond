import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { TextField } from '../../src/components/TextField';
import { colors, spacing, typography } from '../../src/constants/theme';
import { useData } from '../../src/context/DataContext';
import { GROUP_TYPES, GROUP_TYPE_DESCRIPTIONS, GROUP_TYPE_LABELS, type GroupType } from '../../src/types';

export default function NewGroupScreen() {
  const { createGroup } = useData();
  const [groupName, setGroupName] = useState('');
  const [myName, setMyName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('random');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = groupName.trim().length > 0 && myName.trim().length > 0;

  async function handleCreate() {
    if (!canSubmit) return;
    setSubmitting(true);
    const groupId = await createGroup(groupName, myName, groupType);
    router.replace(`/group/${groupId}`);
  }

  return (
    <Screen>
      <Text style={typography.muted}>
        Geef je kookgroep een naam en vul je eigen naam in. Je krijgt daarna een code om andere te
        laten aansluiten.
      </Text>
      <TextField
        label="Naam van de groep"
        placeholder="Bijv. Kookclub Oost"
        value={groupName}
        onChangeText={setGroupName}
        autoFocus
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={typography.muted}>Wat voor kookavonden?</Text>
        {GROUP_TYPES.map((type) => {
          const selected = groupType === type;
          return (
            <Pressable key={type} onPress={() => setGroupType(type)}>
              <Card
                style={selected ? { borderColor: colors.primary, backgroundColor: `${colors.primary}0D` } : undefined}
              >
                <Text style={[typography.body, { fontWeight: '700' }]}>{GROUP_TYPE_LABELS[type]}</Text>
                <Text style={typography.muted}>{GROUP_TYPE_DESCRIPTIONS[type]}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <TextField label="Jouw naam" placeholder="Bijv. Marvin" value={myName} onChangeText={setMyName} />
      <Button title="Groep aanmaken" onPress={handleCreate} disabled={!canSubmit} loading={submitting} />
    </Screen>
  );
}
