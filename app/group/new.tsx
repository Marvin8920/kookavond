import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { TextField } from '../../src/components/TextField';
import { typography } from '../../src/constants/theme';
import { useData } from '../../src/context/DataContext';

export default function NewGroupScreen() {
  const { createGroup } = useData();
  const [groupName, setGroupName] = useState('');
  const [myName, setMyName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = groupName.trim().length > 0 && myName.trim().length > 0;

  async function handleCreate() {
    if (!canSubmit) return;
    setSubmitting(true);
    const groupId = await createGroup(groupName, myName);
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
      <TextField label="Jouw naam" placeholder="Bijv. Marvin" value={myName} onChangeText={setMyName} />
      <Button title="Groep aanmaken" onPress={handleCreate} disabled={!canSubmit} loading={submitting} />
    </Screen>
  );
}
