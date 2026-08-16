import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Badge } from '../../../../src/components/Badge';
import { Button } from '../../../../src/components/Button';
import { Card } from '../../../../src/components/Card';
import { ChatPanel } from '../../../../src/components/ChatPanel';
import { Screen } from '../../../../src/components/Screen';
import { colors, radius, spacing, typography } from '../../../../src/constants/theme';
import { useData } from '../../../../src/context/DataContext';
import { itemLabel, KITCHEN_THEMES } from '../../../../src/types';
import { buildEventIcs } from '../../../../src/logic/calendarExport';
import { formatDateNl, toIsoDate } from '../../../../src/logic/format';

export default function EventDetailScreen() {
  const { groupId, eventId } = useLocalSearchParams<{ groupId: string; eventId: string }>();
  const { data, getGroup, getEvent, getMembers, getMyMemberId, isOrganizer, overrideTheme, swapCourseAssignments } =
    useData();

  const event = getEvent(eventId);
  const group = getGroup(groupId);
  const groupType = group?.groupType ?? 'random';
  const members = getMembers(groupId);
  const myMemberId = getMyMemberId(groupId);
  const organizer = isOrganizer(groupId);
  const [swapSelection, setSwapSelection] = useState<string | null>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  const assignments = useMemo(
    () => data.courseAssignments.filter((ca) => ca.eventId === eventId),
    [data.courseAssignments, eventId],
  );

  if (!event) {
    return (
      <Screen>
        <Text style={typography.heading}>Kookavond niet gevonden</Text>
      </Screen>
    );
  }

  const attendees = assignments
    .map((a) => ({ assignment: a, member: members.find((m) => m.id === a.memberId) }))
    .filter((a): a is { assignment: typeof a.assignment; member: NonNullable<typeof a.member> } => !!a.member);

  const iAmAttendee = !!myMemberId && assignments.some((a) => a.memberId === myMemberId);
  const isUpcoming = !!event.confirmedDate && event.confirmedDate >= toIsoDate(new Date());

  async function handleAddToCalendar() {
    if (!event?.confirmedDate) return;
    setAddingToCalendar(true);
    try {
      const ics = buildEventIcs({
        eventId,
        groupName: group?.name ?? 'Kookavond',
        date: event.confirmedDate,
        theme: event.theme,
        assignments: attendees.map((a) => ({
          name: a.member.name,
          item: itemLabel(groupType, a.assignment.course),
        })),
      });

      if (Platform.OS === 'web') {
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kookavond-${event.confirmedDate}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const file = new File(Paths.cache, `kookavond-${event.confirmedDate}-${Date.now()}.ics`);
        file.create();
        file.write(ics);
        await Sharing.shareAsync(file.uri, { mimeType: 'text/calendar', dialogTitle: 'Voeg toe aan agenda' });
      }
    } finally {
      setAddingToCalendar(false);
    }
  }

  function handleRowPress(memberId: string) {
    if (!swapSelection) {
      setSwapSelection(memberId);
      return;
    }
    if (swapSelection === memberId) {
      setSwapSelection(null);
      return;
    }
    swapCourseAssignments(eventId, swapSelection, memberId);
    setSwapSelection(null);
  }

  return (
    <Screen>
      <Card>
        <Text style={typography.muted}>{formatDateNl(event.confirmedDate ?? '')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={typography.title}>{event.theme ?? 'Thema volgt'}</Text>
          {organizer && groupType === 'random' ? (
            <Pressable onPress={() => setThemePickerOpen((v) => !v)}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Wijzig</Text>
            </Pressable>
          ) : null}
        </View>

        {themePickerOpen && groupType === 'random' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.xs }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {KITCHEN_THEMES.map((theme) => (
                <Pressable
                  key={theme}
                  onPress={() => {
                    overrideTheme(eventId, theme);
                    setThemePickerOpen(false);
                  }}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: theme === event.theme ? colors.primary : colors.border,
                    backgroundColor: theme === event.theme ? `${colors.primary}14` : colors.surface,
                  }}
                >
                  <Text style={{ color: colors.text }}>{theme}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </Card>

      {isUpcoming ? (
        <Button
          title="Voeg toe aan agenda"
          variant="secondary"
          onPress={handleAddToCalendar}
          loading={addingToCalendar}
        />
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text style={typography.heading}>{groupType === 'bbq' ? 'Wie neemt wat mee' : 'Gangenverdeling'}</Text>
        <Text style={typography.muted}>
          {swapSelection ? 'Kies wie ermee moet ruilen…' : 'Tik op twee namen om te ruilen.'}
        </Text>
        {groupType === 'bbq' ? (
          <Text style={typography.muted}>Drank neemt iedereen zelf mee.</Text>
        ) : null}
        {attendees.map(({ assignment, member }) => {
          const selected = swapSelection === member.id;
          return (
            <Pressable key={assignment.id} onPress={() => handleRowPress(member.id)}>
              <Card
                style={selected ? { borderColor: colors.primary, backgroundColor: `${colors.primary}0D` } : undefined}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={typography.body}>{member.name}</Text>
                  <Badge label={itemLabel(groupType, assignment.course)} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {iAmAttendee && myMemberId ? (
        <ChatPanel eventId={eventId} groupId={groupId} myMemberId={myMemberId} members={members} />
      ) : null}
    </Screen>
  );
}
