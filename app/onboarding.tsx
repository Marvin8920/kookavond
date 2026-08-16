import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { Screen } from '../src/components/Screen';
import { colors, spacing, typography } from '../src/constants/theme';
import { markOnboardingSeen } from '../src/storage/onboardingStore';

const PAGES = [
  {
    emoji: '🍽️',
    title: 'Kookavond',
    body: 'Organiseer kookavonden met je vrienden, zonder gedoe met wie wat kookt.',
  },
  {
    emoji: '🔗',
    title: 'Hoe het werkt',
    body: 'Maak een groepje, stem op een datum die iedereen uitkomt, en klaar. Geen account nodig — deel gewoon een linkje met je vrienden.',
  },
  {
    emoji: '🎉',
    title: 'De verrassing',
    body: 'Kookavond verdeelt automatisch wie het voorgerecht, hoofdgerecht en nagerecht maakt — en kiest een keukenthema voor die avond, zodat elke kookavond weer anders is.',
  },
];

export default function OnboardingScreen() {
  const { code: joinCode } = useLocalSearchParams<{ code?: string }>();
  const [page, setPage] = useState(0);
  const isLast = page === PAGES.length - 1;
  const current = PAGES[page];

  async function finish() {
    await markOnboardingSeen();
    if (joinCode) {
      router.replace({ pathname: '/group/join', params: { code: joinCode } });
    } else {
      router.replace('/');
    }
  }

  function handleNext() {
    if (isLast) {
      finish();
    } else {
      setPage((p) => p + 1);
    }
  }

  return (
    <Screen scroll={false}>
      <View style={styles.skipRow}>
        {!isLast ? (
          <Pressable onPress={finish} hitSlop={8}>
            <Text style={typography.muted}>Overslaan</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={[typography.title, styles.title]}>{current.title}</Text>
        <Text style={[typography.body, styles.text]}>{current.body}</Text>
      </View>

      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <Button title={isLast ? 'Begin met koken' : 'Volgende'} onPress={handleNext} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  skipRow: { minHeight: 24, alignItems: 'flex-end' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  emoji: { fontSize: 64 },
  title: { textAlign: 'center' },
  text: { textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
});
