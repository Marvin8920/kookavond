// Datamodel voor Kookavond.
// Alles is plat opgeslagen (losse arrays met foreign keys via id's) zodat
// deze structuur later 1-op-1 op databasetabellen (bv. Supabase/Postgres) is te mappen.

export type GroupType = 'random' | 'bbq';

export const GROUP_TYPES: GroupType[] = ['random', 'bbq'];

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  random: 'Random',
  bbq: 'BBQ-avond',
};

export const GROUP_TYPE_DESCRIPTIONS: Record<GroupType, string> = {
  random: 'Wisselende voor-, hoofd- en nagerechten met een roulerend keukenthema.',
  bbq: 'Amerikaanse BBQ met verdeelde vleessoorten en bijgerechten. Drank neemt iedereen zelf mee.',
};

/** Gangen voor groepstype "random". */
export type Course = 'borrelhapje' | 'voorgerecht' | 'hoofdgerecht' | 'nagerecht';

export const COURSE_LABELS: Record<Course, string> = {
  borrelhapje: 'Borrelhapje',
  voorgerecht: 'Voorgerecht',
  hoofdgerecht: 'Hoofdgerecht',
  nagerecht: 'Nagerecht',
};

/** Volgorde waarin gangen worden toegevoegd naarmate er meer aanwezigen zijn. */
export const COURSE_PRIORITY: Course[] = ['hoofdgerecht', 'voorgerecht', 'nagerecht', 'borrelhapje'];

/** Categorieën voor groepstype "bbq". Vlees is opgesplitst zodat niemand alle vleeskosten draagt; drank doet iedereen zelf. */
export type BbqCategory = 'hamburgers' | 'salade' | 'toetje' | 'spareribs' | 'worstjes' | 'sate';

export const BBQ_CATEGORY_LABELS: Record<BbqCategory, string> = {
  hamburgers: 'Hamburgers',
  salade: 'Salade / bijgerecht',
  toetje: 'Toetje',
  spareribs: 'Spareribs',
  worstjes: 'Worstjes',
  sate: 'Saté',
};

export const BBQ_PRIORITY: BbqCategory[] = ['hamburgers', 'salade', 'toetje', 'spareribs', 'worstjes', 'sate'];

export const BBQ_FIXED_THEME = 'Amerikaanse BBQ';

/** Wat een aanwezige meeneemt/doet — de gang (random) of BBQ-categorie, afhankelijk van het groepstype. */
export type AssignmentItem = Course | BbqCategory;

export function priorityForGroupType(groupType: GroupType): AssignmentItem[] {
  return groupType === 'bbq' ? BBQ_PRIORITY : COURSE_PRIORITY;
}

export function itemLabel(groupType: GroupType, item: string): string {
  if (groupType === 'bbq') return BBQ_CATEGORY_LABELS[item as BbqCategory] ?? item;
  return COURSE_LABELS[item as Course] ?? item;
}

/** Keukenthema's, alleen van toepassing op groepstype "random" (bbq-groepen hebben een vast thema). */
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
  groupType: GroupType;
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
  /** Vrije tekst: een KitchenTheme voor "random"-groepen, of BBQ_FIXED_THEME voor "bbq"-groepen. */
  theme?: string;
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
  course: AssignmentItem;
}

/** Welk lid dit toestel vertegenwoordigt binnen een groep (geen accounts, dus lokaal bijgehouden). */
export type LocalIdentities = Record<string /* groupId */, string /* memberId */>;

export interface ChatMessage {
  id: string;
  eventId: string;
  memberId: string;
  body: string;
  createdAt: string;
}
