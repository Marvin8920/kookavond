import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '../../../../src/components/Badge';
import { Button } from '../../../../src/components/Button';
import { Card } from '../../../../src/components/Card';
import { Screen } from '../../../../src/components/Screen';
import { colors, radius, spacing, typography } from '../../../../src/constants/theme';
import { useData } from '../../../../src/context/DataContext';
import { formatDateNl } from '../../../../src/logic/format';
import { leadingOption, tallyOptions } from '../../../../src/logic/votes';
import type { VoteResponse } from '../../../../src/types';

const RESPONSES: { value: VoteResponse; label: string; color: string }[] = [
  { value: 'ja', label: 'Ja', color: colors.ja },
  { value: 'misschien', label: 'Misschien', color: colors.misschien },
  { value: 'nee', label: 'Nee', color: colors.nee },
];

export default function PollDetailScreen() {
  const { groupId, eventId } = useLocalSearchParams<{ groupId: string; eventId: string }>();
  const { data, getEvent, getMyMemberId, isOrganizer, castVote, myVoteFor, confirmEvent, cancelPoll } = useData();

  const event = getEvent(eventId);
  const myMemberId = getMyMemberId(groupId);
  const organizer = isOrganizer(groupId);
  const options = useMemo(
    () => data.pollOptions.filter((o) => o.eventId === eventId).sort((a, b) => a.date.localeCompare(b.date)),
    [data.pollOptions, eventId],
  );
  const tallies = tallyOptions(options, data.votes);
  const leading = leadingOption(tallies);
  const [confirming, setConfirming] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  if (!event) {
    return (
      <Screen>
        <Text style={typography.heading}>Prikker niet gevonden</Text>
      </Screen>
    );
  }

  const dateToConfirm = selectedDate ?? leading?.option.date;

  async function handleConfirm() {
    if (!dateToConfirm) return;
    setConfirming(true);
    await confirmEvent(eventId, dateToConfirm);
    router.replace(`/group/${groupId}/event/${eventId}`);
  }

  async function handleCancel() {
    await cancelPoll(eventId);
    router.replace(`/group/${groupId}`);
  }

  return (
    <Screen>
      <Text style={typography.muted}>Geef per datum aan of je kunt.</Text>

      <View style={{ gap: spacing.sm }}>
        {tallies.map(({ option, ja, nee, misschien }) => {
          const myVote = myMemberId ? myVoteFor(option.id, myMemberId) : undefined;
          const isLeading = leading?.option.id === option.id && ja > 0;
          return (
            <Card key={option.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={typography.heading}>{formatDateNl(option.date)}</Text>
                {isLeading ? <Badge label="Meeste stemmen" color={colors.accent} /> : null}
              </View>
              <Text style={typography.muted}>
                {ja} ja · {misschien} misschien · {nee} nee
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                {RESPONSES.map((r) => {
                  const selected = myVote === r.value;
                  return (
                    <Pressable
                      key={r.value}
                      onPress={() => myMemberId && castVote(option.id, myMemberId, r.value)}
                      style={{
                        flex: 1,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        backgroundColor: selected ? r.color : colors.background,
                        borderWidth: 1,
                        borderColor: selected ? r.color : colors.border,
                      }}
                    >
                      <Text style={{ color: selected ? '#fff' : colors.text, fontWeight: '600' }}>{r.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </View>

      {organizer ? (
        <Card>
          <Text style={typography.heading}>Datum bevestigen</Text>
          <Text style={typography.muted}>Als organisator kies je de definitieve datum voor deze kookavond.</Text>
          <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            {options.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => setSelectedDate(o.date)}
                style={{
                  padding: spacing.sm,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: dateToConfirm === o.date ? colors.primary : colors.border,
                  backgroundColor: dateToConfirm === o.date ? `${colors.primary}14` : 'transparent',
                }}
              >
                <Text style={typography.body}>{formatDateNl(o.date)}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Bevestig deze datum" onPress={handleConfirm} disabled={!dateToConfirm} loading={confirming} />
          <Button title="Verwijder deze prikker" variant="ghost" onPress={handleCancel} />
        </Card>
      ) : null}
    </Screen>
  );
}
