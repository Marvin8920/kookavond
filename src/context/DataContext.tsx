import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { assignCourses } from '../logic/courseAssignment';
import { toIsoDate } from '../logic/format';
import { generateId, generateInviteCode } from '../logic/ids';
import { suggestTheme } from '../logic/themeRotation';
import { AsyncStorageDataStore } from '../storage/AsyncStorageDataStore';
import type { DataStore } from '../storage/DataStore';
import { emptyData, type KookavondData } from '../storage/schema';
import type { Course, Group, KitchenTheme, KookEvent, Member, VoteResponse } from '../types';

const store: DataStore = new AsyncStorageDataStore();

function todayIso(): string {
  return toIsoDate(new Date());
}

interface DataContextValue {
  loading: boolean;
  data: KookavondData;

  myGroups: Group[];
  getGroup: (groupId: string) => Group | undefined;
  getMembers: (groupId: string) => Member[];
  getMyMemberId: (groupId: string) => string | undefined;
  isOrganizer: (groupId: string) => boolean;

  createGroup: (groupName: string, myName: string) => Promise<string>;
  joinGroup: (code: string, myName: string) => Promise<string>;

  getActivePoll: (groupId: string) => KookEvent | undefined;
  getUpcomingConfirmed: (groupId: string) => KookEvent | undefined;
  getHistory: (groupId: string) => KookEvent[];
  getEvent: (eventId: string) => KookEvent | undefined;

  createPoll: (groupId: string, dates: string[]) => Promise<string>;
  castVote: (pollOptionId: string, memberId: string, response: VoteResponse) => Promise<void>;
  myVoteFor: (pollOptionId: string, memberId: string) => VoteResponse | undefined;
  cancelPoll: (eventId: string) => Promise<void>;

  confirmEvent: (eventId: string, chosenDate: string) => Promise<void>;
  overrideTheme: (eventId: string, theme: KitchenTheme) => Promise<void>;
  swapCourseAssignments: (eventId: string, memberIdA: string, memberIdB: string) => Promise<void>;
  reassignCourse: (eventId: string, memberId: string, course: Course) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<KookavondData>(emptyData());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.load().then((loaded) => {
      setData(loaded);
      setLoading(false);
    });
  }, []);

  const persist = useCallback((next: KookavondData) => {
    setData(next);
    store.save(next);
  }, []);

  const getGroup = useCallback((groupId: string) => data.groups.find((g) => g.id === groupId), [data.groups]);

  const getMembers = useCallback(
    (groupId: string) => data.members.filter((m) => m.groupId === groupId),
    [data.members],
  );

  const getMyMemberId = useCallback((groupId: string) => data.identities[groupId], [data.identities]);

  const isOrganizer = useCallback(
    (groupId: string) => {
      const group = getGroup(groupId);
      const myId = getMyMemberId(groupId);
      return !!group && !!myId && group.organizerMemberId === myId;
    },
    [getGroup, getMyMemberId],
  );

  const myGroups = useMemo(
    () => data.groups.filter((g) => !!data.identities[g.id]),
    [data.groups, data.identities],
  );

  const createGroup = useCallback(
    async (groupName: string, myName: string) => {
      const groupId = generateId();
      const memberId = generateId();
      const now = new Date().toISOString();
      const group: Group = {
        id: groupId,
        name: groupName.trim(),
        inviteCode: generateInviteCode(),
        organizerMemberId: memberId,
        createdAt: now,
      };
      const member: Member = { id: memberId, groupId, name: myName.trim(), createdAt: now };
      persist({
        ...data,
        groups: [...data.groups, group],
        members: [...data.members, member],
        identities: { ...data.identities, [groupId]: memberId },
      });
      return groupId;
    },
    [data, persist],
  );

  const joinGroup = useCallback(
    async (code: string, myName: string) => {
      const normalized = code.trim().toUpperCase();
      const group = data.groups.find((g) => g.inviteCode === normalized);
      if (!group) {
        throw new Error('Geen groep gevonden met deze code. Controleer de code en probeer opnieuw.');
      }
      const existingMemberId = data.identities[group.id];
      if (existingMemberId) {
        return group.id;
      }
      const memberId = generateId();
      const member: Member = { id: memberId, groupId: group.id, name: myName.trim(), createdAt: new Date().toISOString() };
      persist({
        ...data,
        members: [...data.members, member],
        identities: { ...data.identities, [group.id]: memberId },
      });
      return group.id;
    },
    [data, persist],
  );

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

  const createPoll = useCallback(
    async (groupId: string, dates: string[]) => {
      const myId = data.identities[groupId];
      if (!myId) throw new Error('Je bent geen lid van deze groep.');
      const eventId = generateId();
      const now = new Date().toISOString();
      const event: KookEvent = {
        id: eventId,
        groupId,
        status: 'poll',
        createdByMemberId: myId,
        createdAt: now,
      };
      const options = dates.map((date) => ({ id: generateId(), eventId, date }));
      persist({
        ...data,
        events: [...data.events, event],
        pollOptions: [...data.pollOptions, ...options],
      });
      return eventId;
    },
    [data, persist],
  );

  const castVote = useCallback(
    async (pollOptionId: string, memberId: string, response: VoteResponse) => {
      const existing = data.votes.find((v) => v.pollOptionId === pollOptionId && v.memberId === memberId);
      const votes = existing
        ? data.votes.map((v) => (v.id === existing.id ? { ...v, response } : v))
        : [...data.votes, { id: generateId(), pollOptionId, memberId, response }];
      persist({ ...data, votes });
    },
    [data, persist],
  );

  const myVoteFor = useCallback(
    (pollOptionId: string, memberId: string) =>
      data.votes.find((v) => v.pollOptionId === pollOptionId && v.memberId === memberId)?.response,
    [data.votes],
  );

  const cancelPoll = useCallback(
    async (eventId: string) => {
      persist({
        ...data,
        events: data.events.filter((e) => e.id !== eventId),
        pollOptions: data.pollOptions.filter((o) => o.eventId !== eventId),
        votes: data.votes.filter((v) => !data.pollOptions.some((o) => o.eventId === eventId && o.id === v.pollOptionId)),
      });
    },
    [data, persist],
  );

  const confirmEvent = useCallback(
    async (eventId: string, chosenDate: string) => {
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
      const courseHistory = data.courseAssignments.filter((ca) =>
        pastGroupEvents.some((e) => e.id === ca.eventId),
      );

      const assignment = assignCourses(attendeeIds, courseHistory);
      const newAssignments = Object.entries(assignment).map(([memberId, course]) => ({
        id: generateId(),
        eventId,
        memberId,
        course,
      }));

      const theme = suggestTheme(pastGroupEvents);

      const updatedEvent: KookEvent = { ...event, status: 'confirmed', confirmedDate: chosenDate, theme };

      persist({
        ...data,
        events: data.events.map((e) => (e.id === eventId ? updatedEvent : e)),
        courseAssignments: [...data.courseAssignments, ...newAssignments],
      });
    },
    [data, persist],
  );

  const overrideTheme = useCallback(
    async (eventId: string, theme: KitchenTheme) => {
      persist({ ...data, events: data.events.map((e) => (e.id === eventId ? { ...e, theme } : e)) });
    },
    [data, persist],
  );

  const swapCourseAssignments = useCallback(
    async (eventId: string, memberIdA: string, memberIdB: string) => {
      const a = data.courseAssignments.find((ca) => ca.eventId === eventId && ca.memberId === memberIdA);
      const b = data.courseAssignments.find((ca) => ca.eventId === eventId && ca.memberId === memberIdB);
      if (!a || !b) return;
      persist({
        ...data,
        courseAssignments: data.courseAssignments.map((ca) => {
          if (ca.id === a.id) return { ...ca, course: b.course };
          if (ca.id === b.id) return { ...ca, course: a.course };
          return ca;
        }),
      });
    },
    [data, persist],
  );

  const reassignCourse = useCallback(
    async (eventId: string, memberId: string, course: Course) => {
      persist({
        ...data,
        courseAssignments: data.courseAssignments.map((ca) =>
          ca.eventId === eventId && ca.memberId === memberId ? { ...ca, course } : ca,
        ),
      });
    },
    [data, persist],
  );

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
