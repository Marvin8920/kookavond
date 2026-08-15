import type {
  CourseAssignment,
  DatePollOption,
  Group,
  KookEvent,
  LocalIdentities,
  Member,
  Vote,
} from '../types';

/** Samengevoegde weergave van alle groepen die dit toestel kent (uit Supabase + lokale identiteiten). */
export interface KookavondData {
  groups: Group[];
  members: Member[];
  events: KookEvent[];
  pollOptions: DatePollOption[];
  votes: Vote[];
  courseAssignments: CourseAssignment[];
  identities: LocalIdentities;
}
