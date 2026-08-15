import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { useEventChat } from '../hooks/useEventChat';
import type { Member } from '../types';
import { Button } from './Button';
import { TextField } from './TextField';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ChatPanel({
  eventId,
  groupId,
  myMemberId,
  members,
}: {
  eventId: string;
  groupId: string;
  myMemberId: string;
  members: Member[];
}) {
  const { messages, loading, sending, send } = useEventChat(eventId, groupId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  function memberName(memberId: string): string {
    return members.find((m) => m.id === memberId)?.name ?? 'Onbekend lid';
  }

  async function handleSend() {
    const body = draft;
    setDraft('');
    await send(myMemberId, body);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }

  return (
    <View style={styles.wrap}>
      <Text style={typography.heading}>Chat</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {!loading && messages.length === 0 ? (
          <Text style={typography.muted}>Nog geen berichten. Zeg hallo!</Text>
        ) : null}
        {messages.map((m) => {
          const isMine = m.memberId === myMemberId;
          return (
            <View key={m.id} style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                {!isMine ? <Text style={styles.author}>{memberName(m.memberId)}</Text> : null}
                <Text style={isMine ? styles.bodyMine : styles.body}>{m.body}</Text>
                <Text style={isMine ? styles.timeMine : styles.time}>{formatTime(m.createdAt)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.composer}>
        <View style={{ flex: 1 }}>
          <TextField
            value={draft}
            onChangeText={setDraft}
            placeholder="Typ een bericht…"
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
        </View>
        <Button title="Stuur" onPress={handleSend} disabled={!draft.trim()} loading={sending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  messages: { maxHeight: 320, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.sm },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleOther: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  bubbleMine: { backgroundColor: colors.primary },
  author: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 2 },
  body: { fontSize: 15, color: colors.text },
  bodyMine: { fontSize: 15, color: '#fff' },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 2, alignSelf: 'flex-end' },
  timeMine: { fontSize: 10, color: '#ffffffb0', marginTop: 2, alignSelf: 'flex-end' },
  composer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
});
