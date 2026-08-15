import { supabase } from './supabaseClient';
import type {
  Course,
  CourseAssignment,
  DatePollOption,
  Group,
  KitchenTheme,
  KookEvent,
  Member,
  Vote,
  VoteResponse,
} from '../types';

export interface GroupBundle {
  group: Group;
  members: Member[];
  events: KookEvent[];
  pollOptions: DatePollOption[];
  votes: Vote[];
  courseAssignments: CourseAssignment[];
}

function toGroup(row: any): Group {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    organizerMemberId: row.organizer_member_id,
    createdAt: row.created_at,
  };
}

function toMember(row: any): Member {
  return { id: row.id, groupId: row.group_id, name: row.name, createdAt: row.created_at };
}

function toEvent(row: any): KookEvent {
  return {
    id: row.id,
    groupId: row.group_id,
    status: row.status,
    title: row.title ?? undefined,
    confirmedDate: row.confirmed_date ?? undefined,
    theme: row.theme ?? undefined,
    createdByMemberId: row.created_by_member_id,
    createdAt: row.created_at,
  };
}

function toPollOption(row: any): DatePollOption {
  return { id: row.id, eventId: row.event_id, date: row.date };
}

function toVote(row: any): Vote {
  return { id: row.id, pollOptionId: row.poll_option_id, memberId: row.member_id, response: row.response };
}

function toCourseAssignment(row: any): CourseAssignment {
  return { id: row.id, eventId: row.event_id, memberId: row.member_id, course: row.course };
}

function throwIfError<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('Geen data ontvangen van Supabase.');
  return result.data;
}

export async function findGroupByCode(code: string): Promise<Group | null> {
  const { data, error } = await supabase.from('groups').select('*').eq('invite_code', code).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toGroup(data) : null;
}

export async function fetchGroupBundle(groupId: string): Promise<GroupBundle> {
  const [groupRes, membersRes, eventsRes, pollOptionsRes, votesRes, courseAssignmentsRes] = await Promise.all([
    supabase.from('groups').select('*').eq('id', groupId).single(),
    supabase.from('members').select('*').eq('group_id', groupId),
    supabase.from('events').select('*').eq('group_id', groupId),
    supabase.from('poll_options').select('*').eq('group_id', groupId),
    supabase.from('votes').select('*').eq('group_id', groupId),
    supabase.from('course_assignments').select('*').eq('group_id', groupId),
  ]);

  return {
    group: toGroup(throwIfError(groupRes)),
    members: throwIfError(membersRes).map(toMember),
    events: throwIfError(eventsRes).map(toEvent),
    pollOptions: throwIfError(pollOptionsRes).map(toPollOption),
    votes: throwIfError(votesRes).map(toVote),
    courseAssignments: throwIfError(courseAssignmentsRes).map(toCourseAssignment),
  };
}

export async function insertGroup(group: Group): Promise<void> {
  const { error } = await supabase.from('groups').insert({
    id: group.id,
    name: group.name,
    invite_code: group.inviteCode,
    organizer_member_id: group.organizerMemberId,
    created_at: group.createdAt,
  });
  if (error) throw new Error(error.message);
}

export async function insertMember(member: Member): Promise<void> {
  const { error } = await supabase.from('members').insert({
    id: member.id,
    group_id: member.groupId,
    name: member.name,
    created_at: member.createdAt,
  });
  if (error) throw new Error(error.message);
}

export async function insertEventWithOptions(event: KookEvent, options: DatePollOption[]): Promise<void> {
  const { error: eventError } = await supabase.from('events').insert({
    id: event.id,
    group_id: event.groupId,
    status: event.status,
    title: event.title ?? null,
    confirmed_date: event.confirmedDate ?? null,
    theme: event.theme ?? null,
    created_by_member_id: event.createdByMemberId,
    created_at: event.createdAt,
  });
  if (eventError) throw new Error(eventError.message);

  if (options.length > 0) {
    const { error: optionsError } = await supabase.from('poll_options').insert(
      options.map((o) => ({ id: o.id, event_id: o.eventId, group_id: event.groupId, date: o.date })),
    );
    if (optionsError) throw new Error(optionsError.message);
  }
}

export async function upsertVote(groupId: string, vote: Vote): Promise<void> {
  const { error } = await supabase
    .from('votes')
    .upsert(
      { id: vote.id, poll_option_id: vote.pollOptionId, group_id: groupId, member_id: vote.memberId, response: vote.response },
      { onConflict: 'poll_option_id,member_id' },
    );
  if (error) throw new Error(error.message);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw new Error(error.message);
}

export async function confirmEventWithAssignments(
  eventId: string,
  groupId: string,
  chosenDate: string,
  theme: KitchenTheme,
  assignments: CourseAssignment[],
): Promise<void> {
  const { error: eventError } = await supabase
    .from('events')
    .update({ status: 'confirmed', confirmed_date: chosenDate, theme })
    .eq('id', eventId);
  if (eventError) throw new Error(eventError.message);

  if (assignments.length > 0) {
    const { error: assignError } = await supabase.from('course_assignments').insert(
      assignments.map((a) => ({ id: a.id, event_id: a.eventId, group_id: groupId, member_id: a.memberId, course: a.course })),
    );
    if (assignError) throw new Error(assignError.message);
  }
}

export async function updateTheme(eventId: string, theme: KitchenTheme): Promise<void> {
  const { error } = await supabase.from('events').update({ theme }).eq('id', eventId);
  if (error) throw new Error(error.message);
}

export async function updateCourseAssignment(eventId: string, memberId: string, course: Course): Promise<void> {
  const { error } = await supabase
    .from('course_assignments')
    .update({ course })
    .eq('event_id', eventId)
    .eq('member_id', memberId);
  if (error) throw new Error(error.message);
}

export type RealtimeTable = 'groups' | 'members' | 'events' | 'poll_options' | 'votes' | 'course_assignments';

export function subscribeToGroup(groupId: string, onChange: () => void): () => void {
  const tables: RealtimeTable[] = ['members', 'events', 'poll_options', 'votes', 'course_assignments'];
  const channel = supabase.channel(`group-${groupId}`);
  for (const table of tables) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `group_id=eq.${groupId}` },
      onChange,
    );
  }
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
