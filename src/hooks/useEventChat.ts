import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchMessages, sendMessage, subscribeToMessages } from '../storage/supabaseRepository';
import type { ChatMessage } from '../types';

export function useEventChat(eventId: string, groupId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);

    const refresh = () => {
      fetchMessages(eventId).then((msgs) => {
        if (mounted.current) setMessages(msgs);
      });
    };

    fetchMessages(eventId).then((msgs) => {
      if (mounted.current) {
        setMessages(msgs);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToMessages(eventId, refresh);

    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [eventId]);

  const send = useCallback(
    async (memberId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      setSending(true);
      try {
        await sendMessage(eventId, groupId, memberId, trimmed);
      } finally {
        if (mounted.current) setSending(false);
      }
    },
    [eventId, groupId],
  );

  return { messages, loading, sending, send };
}
