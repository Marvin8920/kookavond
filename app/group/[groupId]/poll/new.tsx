import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../../../src/components/Button';
import { CalendarPicker } from '../../../../src/components/CalendarPicker';
import { Screen } from '../../../../src/components/Screen';
import { colors, spacing, typography } from '../../../../src/constants/theme';
import { useData } from '../../../../src/context/DataContext';
import { formatDateNl } from '../../../../src/logic/format';

export default function NewPollScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { createPoll } = useData();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleDate(iso: string) {
    setSelectedDates((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort()));
  }

  async function handleCreate() {
    if (selectedDates.length === 0) return;
    setSubmitting(true);
    const eventId = await createPoll(groupId, selectedDates);
    router.replace(`/group/${groupId}/poll/${eventId}`);
  }

  return (
    <Screen>
      <Text style={typography.muted}>
        Kies een of meer data waarop de groep kan stemmen. Iedereen geeft daarna aan of ze kunnen.
      </Text>

      <CalendarPicker selectedDates={selectedDates} onToggleDate={toggleDate} />

      {selectedDates.length > 0 ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={typography.heading}>Gekozen data</Text>
          {selectedDates.map((d) => (
            <Text key={d} style={typography.body}>
              {formatDateNl(d)}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={{ color: colors.textMuted }}>Nog geen data gekozen.</Text>
      )}

      <Button
        title="Prikker versturen"
        onPress={handleCreate}
        disabled={selectedDates.length === 0}
        loading={submitting}
      />
    </Screen>
  );
}
