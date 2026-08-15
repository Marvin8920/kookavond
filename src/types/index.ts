// Datamodel voor Kookavond.
// Alles is plat opgeslagen (losse arrays met foreign keys via id's) zodat
// deze structuur later 1-op-1 op databasetabellen (bv. Supabase/Postgres) is te mappen.

export type Course = 'borrelhapje' | 'voorgerecht' | 'hoofdgerecht' | 'nagerecht';

export const ALL_COURSES: Course[] = ['borrelhapje', 'voorgerecht', 'hoofdgerecht', 'nagerecht'];

export const CORE_COURSES: Course[] = ['voorgerecht', 'hoofdgerecht', 'nagerecht'];

export const COURSE_LABELS: Record<Course, string> = {
  borrelhapje: 'Borrelhapje',
  voorgerecht: 'Voorgerecht',
  hoofdgerecht: 'Hoofdgerecht',
  nagerecht: 'Nagerecht',
};

export const KITCHEN_THEMES = [
  'Italiaans',
  'Mexicaans',
  'Aziatisch',
  'Frans',
  'Grieks',
  'Midden-Oosters',
] as const;

export type KitchenTheme = (typeof KITCHEN_THEMES)[number];

export type VoteResponse = 'ja' | 'nee' | 'misschien';

export type EventStatus = 'poll' | 'confirmed' | 'cancelled';

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  organizerMemberId: string;
  createdAt: string; // ISO date
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
  createdAt: string;
}

export interface KookEvent {
  id: string;
  groupId: string;
  status: EventStatus;
  title?: string;
  /** Definitieve datum, alleen gezet als status 'confirmed' is. ISO date (yyyy-mm-dd). */
  confirmedDate?: string;
  theme?: KitchenTheme;
  createdByMemberId: string;
  createdAt: string;
}

export interface DatePollOption {
  id: string;
  eventId: string;
  date: string; // ISO date (yyyy-mm-dd)
}

export interface Vote {
  id: string;
  pollOptionId: string;
  memberId: string;
  response: VoteResponse;
}

export interface CourseAssignment {
  id: string;
  eventId: string;
  memberId: string;
  course: Course;
}

/** Welk lid dit toestel vertegenwoordigt binnen een groep (geen accounts, dus lokaal bijgehouden). */
export type LocalIdentities = Record<string /* groupId */, string /* memberId */>;
