import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { toIsoDate } from '../logic/format';

const MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];
const WEEKDAY_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildMonthGrid(monthAnchor: Date): (Date | null)[] {
  const first = startOfMonth(monthAnchor);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  // getDay(): 0=zo..6=za -> we willen maandag eerst
  const leading = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = Array(leading).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CalendarPicker({
  selectedDates,
  onToggleDate,
}: {
  selectedDates: string[];
  onToggleDate: (iso: string) => void;
}) {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const today = toIsoDate(new Date());
  const cells = buildMonthGrid(monthAnchor);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))}
          hitSlop={8}
          style={styles.navButton}
        >
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={typography.body}>
          {MONTHS[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}
        </Text>
        <Pressable
          onPress={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))}
          hitSlop={8}
          style={styles.navButton}
        >
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((w) => (
          <Text key={w} style={[typography.muted, styles.weekdayCell]}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.dayCell} />;
          const iso = toIsoDate(date);
          const isPast = iso < today;
          const isSelected = selectedDates.includes(iso);
          return (
            <Pressable
              key={i}
              disabled={isPast}
              onPress={() => onToggleDate(iso)}
              style={[styles.dayCell, styles.dayTouchable, isSelected && styles.daySelected, isPast && styles.dayPast]}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isPast && styles.dayTextPast]}>
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL = 40;

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, width: CELL * 7, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  navButton: { padding: spacing.xs },
  navText: { fontSize: 20, color: colors.primary, fontWeight: '700' },
  weekRow: { flexDirection: 'row' },
  weekdayCell: { width: CELL, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  dayTouchable: { borderRadius: radius.pill },
  daySelected: { backgroundColor: colors.primary },
  dayPast: {},
  dayText: { fontSize: 15, color: colors.text },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dayTextPast: { color: colors.textMuted },
});
