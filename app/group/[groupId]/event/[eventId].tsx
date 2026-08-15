import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge } from '../../../../src/components/Badge';
import { Card } from '../../../../src/components/Card';
import { Screen } from '../../../../src/components/Screen';
import { colors, radius, spacing, typography } from '../../../../src/constants/theme';
import { useData } from '../../../../src/context/DataContext';
import { COURSE_LABELS } from '../../../../src/types';
import { formatDateNl } from '../../../../src/logic/format';
import { KITCHEN_THEMES, type KitchenTheme } from '../../../../src/types';

export default function EventDetailScreen() {
  const { groupId, eventId } = useLocalSearchParams<{ groupId: string; eventId: string }>();
  const { data, getEvent, getMembers, isOrganizer, overrideTheme, swapCourseAssignments } = useData();

  const event = getEvent(eventId);
  const members = getMembers(groupId);
  const organizer = isOrganizer(groupId);
  const [swapSelection, setSwapSelection] = useState<string | null>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

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
          {organizer ? (
            <Pressable onPress={() => setThemePickerOpen((v) => !v)}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Wijzig</Text>
            </Pressable>
          ) : null}
        </View>

        {themePickerOpen ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.xs }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {KITCHEN_THEMES.map((theme) => (
                <Pressable
                  key={theme}
                  onPress={() => {
                    overrideTheme(eventId, theme as KitchenTheme);
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

      <View style={{ gap: spacing.sm }}>
        <Text style={typography.heading}>Gangenverdeling</Text>
        <Text style={typography.muted}>
          {swapSelection ? 'Kies wie ermee moet ruilen…' : 'Tik op twee namen om gangen te ruilen.'}
        </Text>
        {attendees.map(({ assignment, member }) => {
          const selected = swapSelection === member.id;
          return (
            <Pressable key={assignment.id} onPress={() => handleRowPress(member.id)}>
              <Card
                style={selected ? { borderColor: colors.primary, backgroundColor: `${colors.primary}0D` } : undefined}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={typography.body}>{member.name}</Text>
                  <Badge label={COURSE_LABELS[assignment.course]} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
