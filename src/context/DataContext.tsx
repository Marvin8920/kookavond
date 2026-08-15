import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { assignCourses } from '../logic/courseAssignment';
import { toIsoDate } from '../logic/format';
import { generateId, generateInviteCode } from '../logic/ids';
import { suggestTheme } from '../logic/themeRotation';
import { loadIdentities, saveIdentities } from '../storage/identityStore';
import type { KookavondData } from '../storage/schema';
import {
  confirmEventWithAssignments,
  deleteEvent,
  deleteGroup as remoteDeleteGroup,
  fetchGroupBundle,
  findGroupByCode,
  insertEventWithOptions,
  insertGroup,
  insertMember,
  subscribeToGroup,
  updateCourseAssignment as remoteUpdateCourseAssignment,
  updateTheme as remoteUpdateTheme,
  upsertVote,
  type GroupBundle,
} from '../storage/supabaseRepository';
import { fixedThemeFor } from '../types';
import type { AssignmentItem, Group, GroupType, KookEvent, LocalIdentities, Member, VoteResponse } from '../types';

function todayIso(): string {
  return toIsoDate(new Date());
}

function mergeData(bundles: Record<string, GroupBundle>, identities: LocalIdentities): KookavondData {
  const values = Object.values(bundles);
  return {
    groups: values.map((b) => b.group),
    members: values.flatMap((b) => b.members),
    events: values.flatMap((b) => b.events),
    pollOptions: values.flatMap((b) => b.pollOptions),
    votes: values.flatMap((b) => b.votes),
    courseAssignments: values.flatMap((b) => b.courseAssignments),
    identities,
  };
}

interface DataContextValue {
  loading: boolean;
  data: KookavondData;

  myGroups: Group[];
  getGroup: (groupId: string) => Group | undefined;
  getMembers: (groupId: string) => Member[];
  getMyMemberId: (groupId: string) => string | undefined;
  isOrganizer: (groupId: string) => boolean;

  createGroup: (groupName: string, myName: string, groupType: GroupType) => Promise<string>;
  joinGroup: (code: string, myName: string) => Promise<string>;
  deleteGroup: (groupId: string) => Promise<void>;

  getActivePoll: (groupId: string) => KookEvent | undefined;
  getUpcomingConfirmed: (groupId: string) => KookEvent | undefined;
  getHistory: (groupId: string) => KookEvent[];
  getEvent: (eventId: string) => KookEvent | undefined;

  createPoll: (groupId: string, dates: string[]) => Promise<string>;
  castVote: (pollOptionId: string, memberId: string, response: VoteResponse) => Promise<void>;
  myVoteFor: (pollOptionId: string, memberId: string) => VoteResponse | undefined;
  cancelPoll: (eventId: string) => Promise<void>;

  confirmEvent: (eventId: string, chosenDate: string) => Promise<void>;
  overrideTheme: (eventId: string, theme: string) => Promise<void>;
  swapCourseAssignments: (eventId: string, memberIdA: string, memberIdB: string) => Promise<void>;
  reassignCourse: (eventId: string, memberId: string, course: AssignmentItem) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [identities, setIdentities] = useState<LocalIdentities>({});
  const [bundles, setBundles] = useState<Record<string, GroupBundle>>({});
  const [loading, setLoading] = useState(true);
  const subscriptions = useRef<Record<string, () => void>>({});

  const refreshGroup = useCallback(async (groupId: string) => {
    const bundle = await fetchGroupBundle(groupId);
    setBundles((prev) => ({ ...prev, [groupId]: bundle }));
  }, []);

  const ensureSubscribed = useCallback(
    (groupId: string) => {
      if (subscriptions.current[groupId]) return;
      subscriptions.current[groupId] = subscribeToGroup(groupId, () => {
        refreshGroup(groupId);
      });
    },
    [refreshGroup],
  );

  useEffect(() => {
    let cancelled = false;
    loadIdentities().then(async (loaded) => {
      if (cancelled) return;
      setIdentities(loaded);
      const groupIds = Object.keys(loaded);
      await Promise.all(
        groupIds.map(async (groupId) => {
          try {
            await refreshGroup(groupId);
            ensureSubscribed(groupId);
          } catch {
            // Groep kon niet geladen worden (bv. offline); blijft gewoon ontbreken in state.
          }
        }),
      );
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      Object.values(subscriptions.current).forEach((unsub) => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo(() => mergeData(bundles, identities), [bundles, identities]);

  const getGroup = useCallback((groupId: string) => data.groups.find((g) => g.id === groupId), [data.groups]);

  const getMembers = useCallback(
    (groupId: string) => data.members.filter((m) => m.groupId === groupId),
    [data.members],
  );

  const getMyMemberId = useCallback((groupId: string) => identities[groupId], [identities]);

  const isOrganizer = useCallback(
    (groupId: string) => {
      const group = getGroup(groupId);
      const myId = getMyMemberId(groupId);
      return !!group && !!myId && group.organizerMemberId === myId;
    },
    [getGroup, getMyMemberId],
  );

  const myGroups = useMemo(() => data.groups.filter((g) => !!identities[g.id]), [data.groups, identities]);

  const createGroup = useCallback(async (groupName: string, myName: string, groupType: GroupType) => {
    const groupId = generateId();
    const memberId = generateId();
    const now = new Date().toISOString();
    const group: Group = {
      id: groupId,
      name: groupName.trim(),
      inviteCode: generateInviteCode(),
      groupType,
      organizerMemberId: memberId,
      createdAt: now,
    };
    const member: Member = { id: memberId, groupId, name: myName.trim(), createdAt: now };

    await insertGroup(group);
    await insertMember(member);

    const nextIdentities = { ...identities, [groupId]: memberId };
    setIdentities(nextIdentities);
    await saveIdentities(nextIdentities);
    await refreshGroup(groupId);
    ensureSubscribed(groupId);

    return groupId;
  }, [identities, refreshGroup, ensureSubscribed]);

  const joinGroup = useCallback(async (code: string, myName: string) => {
    const normalized = code.trim().toUpperCase();
    const group = await findGroupByCode(normalized);
    if (!group) {
      throw new Error('Geen groep gevonden met deze code. Controleer de code en probeer opnieuw.');
    }

    if (identities[group.id]) {
      await refreshGroup(group.id);
      ensureSubscribed(group.id);
      return group.id;
    }

    const memberId = generateId();
    const member: Member = { id: memberId, groupId: group.id, name: myName.trim(), createdAt: new Date().toISOString() };
    await insertMember(member);

    const nextIdentities = { ...identities, [group.id]: memberId };
    setIdentities(nextIdentities);
    await saveIdentities(nextIdentities);
    await refreshGroup(group.id);
    ensureSubscribed(group.id);

    return group.id;
  }, [identities, refreshGroup, ensureSubscribed]);

  const deleteGroup = useCallback(async (groupId: string) => {
    await remoteDeleteGroup(groupId);

    subscriptions.current[groupId]?.();
    delete subscriptions.current[groupId];

    setBundles((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });

    const nextIdentities = { ...identities };
    delete nextIdentities[groupId];
    setIdentities(nextIdentities);
    await saveIdentities(nextIdentities);
  }, [identities]);

  const getActivePoll = useCallback(
    (groupId: string) => data.events.find((e) => e.groupId === groupId && e.status === 'poll'),
    [data.events],
  );

  const getUpcomingConfirmed = useCallback(
    (groupId: string) => {
      const today = todayIso();
      return data.events
        .filter((e) => e.groupId === groupId && e.status === 'confirmed' && (e.confirmedDate ?? '') >= today)
        .sort((a, b) => (a.confirmedDate ?? '').localeCompare(b.confirmedDate ?? ''))[0];
    },
    [data.events],
  );

  const getHistory = useCallback(
    (groupId: string) => {
      const today = todayIso();
      return data.events
        .filter((e) => e.groupId === groupId && e.status === 'confirmed' && (e.confirmedDate ?? '') < today)
        .sort((a, b) => (b.confirmedDate ?? '').localeCompare(a.confirmedDate ?? ''));
    },
    [data.events],
  );

  const getEvent = useCallback((eventId: string) => data.events.find((e) => e.id === eventId), [data.events]);

  const createPoll = useCallback(async (groupId: string, dates: string[]) => {
    const myId = identities[groupId];
    if (!myId) throw new Error('Je bent geen lid van deze groep.');
    const eventId = generateId();
    const now = new Date().toISOString();
    const event: KookEvent = { id: eventId, groupId, status: 'poll', createdByMemberId: myId, createdAt: now };
    const options = dates.map((date) => ({ id: generateId(), eventId, date }));

    await insertEventWithOptions(event, options);
    await refreshGroup(groupId);
    return eventId;
  }, [identities, refreshGroup]);

  const castVote = useCallback(async (pollOptionId: string, memberId: string, response: VoteResponse) => {
    const option = data.pollOptions.find((o) => o.id === pollOptionId);
    if (!option) return;
    const event = data.events.find((e) => e.id === option.eventId);
    if (!event) return;
    const existing = data.votes.find((v) => v.pollOptionId === pollOptionId && v.memberId === memberId);

    await upsertVote(event.groupId, { id: existing?.id ?? generateId(), pollOptionId, memberId, response });
    await refreshGroup(event.groupId);
  }, [data.pollOptions, data.events, data.votes, refreshGroup]);

  const myVoteFor = useCallback(
    (pollOptionId: string, memberId: string) =>
      data.votes.find((v) => v.pollOptionId === pollOptionId && v.memberId === memberId)?.response,
    [data.votes],
  );

  const cancelPoll = useCallback(async (eventId: string) => {
    const event = data.events.find((e) => e.id === eventId);
    if (!event) return;
    await deleteEvent(eventId);
    await refreshGroup(event.groupId);
  }, [data.events, refreshGroup]);

  const confirmEvent = useCallback(async (eventId: string, chosenDate: string) => {
    const event = data.events.find((e) => e.id === eventId);
    if (!event) return;

    const optionsForEvent = data.pollOptions.filter((o) => o.eventId === eventId);
    const chosenOption = optionsForEvent.find((o) => o.date === chosenDate);
    const groupMembers = data.members.filter((m) => m.groupId === event.groupId);

    let attendeeIds: string[] = [];
    if (chosenOption) {
      attendeeIds = data.votes
        .filter((v) => v.pollOptionId === chosenOption.id && v.response === 'ja')
        .map((v) => v.memberId);
    }
    if (attendeeIds.length === 0) {
      attendeeIds = groupMembers.map((m) => m.id);
    }

    const pastGroupEvents = data.events.filter(
      (e) => e.groupId === event.groupId && e.status === 'confirmed' && e.id !== eventId,
    );
    const courseHistory = data.courseAssignments.filter((ca) => pastGroupEvents.some((e) => e.id === ca.eventId));

    const group = data.groups.find((g) => g.id === event.groupId);
    const groupType: GroupType = group?.groupType ?? 'random';

    const assignment = assignCourses(groupType, attendeeIds, courseHistory);
    const newAssignments = Object.entries(assignment).map(([memberId, course]) => ({
      id: generateId(),
      eventId,
      memberId,
      course,
    }));

    const theme = fixedThemeFor(groupType) ?? suggestTheme(pastGroupEvents);

    await confirmEventWithAssignments(eventId, event.groupId, chosenDate, theme, newAssignments);
    await refreshGroup(event.groupId);
  }, [data.events, data.pollOptions, data.members, data.votes, data.courseAssignments, data.groups, refreshGroup]);

  const overrideTheme = useCallback(async (eventId: string, theme: string) => {
    const event = data.events.find((e) => e.id === eventId);
    if (!event) return;
    await remoteUpdateTheme(eventId, theme);
    await refreshGroup(event.groupId);
  }, [data.events, refreshGroup]);

  const swapCourseAssignments = useCallback(async (eventId: string, memberIdA: string, memberIdB: string) => {
    const event = data.events.find((e) => e.id === eventId);
    if (!event) return;
    const a = data.courseAssignments.find((ca) => ca.eventId === eventId && ca.memberId === memberIdA);
    const b = data.courseAssignments.find((ca) => ca.eventId === eventId && ca.memberId === memberIdB);
    if (!a || !b) return;

    await remoteUpdateCourseAssignment(eventId, memberIdA, b.course);
    await remoteUpdateCourseAssignment(eventId, memberIdB, a.course);
    await refreshGroup(event.groupId);
  }, [data.events, data.courseAssignments, refreshGroup]);

  const reassignCourse = useCallback(async (eventId: string, memberId: string, course: AssignmentItem) => {
    const event = data.events.find((e) => e.id === eventId);
    if (!event) return;
    await remoteUpdateCourseAssignment(eventId, memberId, course);
    await refreshGroup(event.groupId);
  }, [data.events, refreshGroup]);

  const value: DataContextValue = {
    loading,
    data,
    myGroups,
    getGroup,
    getMembers,
    getMyMemberId,
    isOrganizer,
    createGroup,
    joinGroup,
    deleteGroup,
    getActivePoll,
    getUpcomingConfirmed,
    getHistory,
    getEvent,
    createPoll,
    castVote,
    myVoteFor,
    cancelPoll,
    confirmEvent,
    overrideTheme,
    swapCourseAssignments,
    reassignCourse,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData moet binnen een DataProvider gebruikt worden');
  return ctx;
}
