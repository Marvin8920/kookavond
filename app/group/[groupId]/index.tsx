import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, Share, Text, View } from 'react-native';

import { Badge } from '../../../src/components/Badge';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { colors, spacing, typography } from '../../../src/constants/theme';
import { useData } from '../../../src/context/DataContext';
import { formatDateNl } from '../../../src/logic/format';
import { buildInviteLink, buildInviteMessage } from '../../../src/logic/inviteLink';
import { tallyOptions } from '../../../src/logic/votes';

export default function GroupOverviewScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const {
    getGroup,
    getMembers,
    getActivePoll,
    getUpcomingConfirmed,
    getHistory,
    data,
  } = useData();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showLinkFallback, setShowLinkFallback] = useState(false);

  const group = getGroup(groupId);
  const members = getMembers(groupId);
  const activePoll = getActivePoll(groupId);
  const upcoming = getUpcomingConfirmed(groupId);
  const recentHistory = getHistory(groupId).slice(0, 3);

  if (!group) {
    return (
      <Screen>
        <EmptyState title="Groep niet gevonden" />
      </Screen>
    );
  }

  const canProposeNew = !activePoll && !upcoming;

  async function copyCode() {
    try {
      await Clipboard.setStringAsync(group!.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setShowLinkFallback(true);
    }
  }

  async function shareInvite() {
    if (Platform.OS === 'web') {
      try {
        await Clipboard.setStringAsync(buildInviteLink(group!));
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1500);
      } catch {
        setShowLinkFallback(true);
      }
      return;
    }
    try {
      await Share.share({ message: buildInviteMessage(group!) });
    } catch {
      try {
        await Clipboard.setStringAsync(buildInviteLink(group!));
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1500);
      } catch {
        setShowLinkFallback(true);
      }
    }
  }

  return (
    <Screen>
      <Card>
        <Pressable onPress={copyCode}>
          <Text style={typography.muted}>Uitnodigingscode</Text>
          <Text style={[typography.title, { fontSize: 22 }]}>{group.inviteCode}</Text>
          <Text style={typography.muted}>{copied ? 'Gekopieerd!' : 'Tik om code te kopiëren'}</Text>
        </Pressable>
        <Button
          title={linkCopied ? 'Link gekopieerd!' : 'Deel uitnodiging'}
          variant="secondary"
          onPress={shareInvite}
        />
        {showLinkFallback ? (
          <View>
            <Text style={typography.muted}>Kopiëren lukte niet automatisch. Selecteer en kopieer deze link handmatig:</Text>
            <Text selectable style={[typography.body, { fontWeight: '600' }]}>
              {buildInviteLink(group)}
            </Text>
          </View>
        ) : null}
      </Card>

      {activePoll ? (
        <Pressable onPress={() => router.push(`/group/${groupId}/poll/${activePoll.id}`)}>
          <Card>
            <Badge label="Datumprikker loopt" color={colors.misschien} />
            <Text style={typography.heading}>Er wordt gestemd op een datum</Text>
            <PollSummary eventId={activePoll.id} />
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Bekijk & stem →</Text>
          </Card>
        </Pressable>
      ) : upcoming ? (
        <Pressable onPress={() => router.push(`/group/${groupId}/event/${upcoming.id}`)}>
          <Card>
            <Badge label="Volgende kookavond" color={colors.accent} />
            <Text style={typography.heading}>{formatDateNl(upcoming.confirmedDate!)}</Text>
            {upcoming.theme ? <Text style={typography.body}>Thema: {upcoming.theme}</Text> : null}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Bekijk gangenverdeling →</Text>
          </Card>
        </Pressable>
      ) : (
        <Card>
          <EmptyState title="Nog geen kookavond gepland" description="Stel een datum voor om te beginnen." />
        </Card>
      )}

      <Button
        title="Nieuwe kookavond voorstellen"
        onPress={() => router.push(`/group/${groupId}/poll/new`)}
        disabled={!canProposeNew}
        variant={canProposeNew ? 'primary' : 'secondary'}
      />
      {!canProposeNew ? (
        <Text style={typography.muted}>
          Er is al een {activePoll ? 'lopende datumprikker' : 'geplande kookavond'}. Rond die eerst af.
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button title={`Leden (${members.length})`} variant="secondary" onPress={() => router.push(`/group/${groupId}/members`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Geschiedenis" variant="secondary" onPress={() => router.push(`/group/${groupId}/history`)} />
        </View>
      </View>

      {recentHistory.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={typography.heading}>Eerdere kookavonden</Text>
          {recentHistory.map((event) => (
            <Pressable key={event.id} onPress={() => router.push(`/group/${groupId}/event/${event.id}`)}>
              <Card>
                <Text style={typography.body}>{formatDateNl(event.confirmedDate!)}</Text>
                {event.theme ? <Text style={typography.muted}>{event.theme}</Text> : null}
              </Card>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function PollSummary({ eventId }: { eventId: string }) {
  const { data } = useData();
  const options = data.pollOptions.filter((o) => o.eventId === eventId);
  const tallies = tallyOptions(options, data.votes);
  return (
    <View style={{ gap: 2 }}>
      {tallies.map((t) => (
        <Text key={t.option.id} style={typography.muted}>
          {formatDateNl(t.option.date)} · {t.ja} ja, {t.misschien} misschien, {t.nee} nee
        </Text>
      ))}
    </View>
  );
}
