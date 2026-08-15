import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '../constants/theme';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={typography.heading}>{title}</Text>
      {description ? <Text style={[typography.muted, styles.description]}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.xs },
  description: { textAlign: 'center' },
});
