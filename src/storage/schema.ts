import type {
  CourseAssignment,
  DatePollOption,
  Group,
  KookEvent,
  LocalIdentities,
  Member,
  Vote,
} from '../types';

/** Volledige lokale dataset. Vorm van de "database" — handig als export/import shape. */
export interface KookavondData {
  groups: Group[];
  members: Member[];
  events: KookEvent[];
  pollOptions: DatePollOption[];
  votes: Vote[];
  courseAssignments: CourseAssignment[];
  identities: LocalIdentities;
}

export function emptyData(): KookavondData {
  return {
    groups: [],
    members: [],
    events: [],
    pollOptions: [],
    votes: [],
    courseAssignments: [],
    identities: {},
  };
}

export const STORAGE_KEY = 'kookavond:data:v1';
