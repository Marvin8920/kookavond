import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';

import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { TextField } from '../../src/components/TextField';
import { colors, typography } from '../../src/constants/theme';
import { useData } from '../../src/context/DataContext';
import { hasSeenOnboarding } from '../../src/storage/onboardingStore';

export default function JoinGroupScreen() {
  const { joinGroup } = useData();
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(codeParam ?? '');
  const [myName, setMyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hasSeenOnboarding().then((seen) => {
      if (cancelled) return;
      if (seen) {
        setOnboardingChecked(true);
      } else {
        router.replace({ pathname: '/onboarding', params: codeParam ? { code: codeParam } : {} });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = code.trim().length > 0 && myName.trim().length > 0;

  if (!onboardingChecked) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  async function handleJoin() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const groupId = await joinGroup(code, myName);
      router.replace(`/group/${groupId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis.');
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={typography.muted}>
        {codeParam
          ? 'Je bent uitgenodigd voor een kookgroep. Vul je naam in om aan te sluiten.'
          : 'Vraag de uitnodigingscode aan iemand die al in de groep zit en vul je eigen naam in.'}
      </Text>
      <TextField
        label="Uitnodigingscode"
        placeholder="Bijv. AB3XQ9"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoFocus={!codeParam}
      />
      <TextField
        label="Jouw naam"
        placeholder="Bijv. Marvin"
        value={myName}
        onChangeText={setMyName}
        autoFocus={!!codeParam}
      />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <Button title="Aansluiten" onPress={handleJoin} disabled={!canSubmit} loading={submitting} />
    </Screen>
  );
}
