import { priorityForGroupType, type AssignmentItem, type CourseAssignment, type GroupType, type Member } from '../types';

/**
 * Bepaalt welke items er die avond verdeeld worden (gangen voor "random",
 * BBQ-categorieën voor "bbq"), 1 slot per aanwezige.
 * - Genoeg aanwezigen: alle items uit de prioriteitenlijst voor dit groepstype.
 * - Te weinig aanwezigen: eerste N items uit de prioriteitenlijst (belangrijkste eerst).
 * - Meer aanwezigen dan itemtypes: items worden herhaald (round robin) zodat iedereen een slot heeft.
 */
export function determineCourseSlots(groupType: GroupType, attendeeCount: number): AssignmentItem[] {
  if (attendeeCount <= 0) return [];

  const priority = priorityForGroupType(groupType);

  if (attendeeCount <= priority.length) {
    return priority.slice(0, attendeeCount);
  }

  const slots: AssignmentItem[] = [];
  for (let i = 0; i < attendeeCount; i++) {
    slots.push(priority[i % priority.length]);
  }
  return slots;
}

interface Score {
  courseCount: number;
  totalCount: number;
  memberId: string;
}

function compareScore(a: Score, b: Score): number {
  if (a.courseCount !== b.courseCount) return a.courseCount - b.courseCount;
  if (a.totalCount !== b.totalCount) return a.totalCount - b.totalCount;
  return a.memberId < b.memberId ? -1 : a.memberId > b.memberId ? 1 : 0;
}

/**
 * Verdeelt de slots eerlijk over de aanwezige leden, op basis van de
 * geschiedenis van eerdere kookavonden in de groep (courseHistory).
 *
 * Greedy min-cost matching: kiest steeds de (lid, item)-combinatie waarbij dat
 * lid dat specifieke item het minst vaak eerder deed (bij gelijke stand: wie
 * in totaal het minst vaak iets deed, dan alfabetisch voor determinisme).
 */
export function assignCourses(
  groupType: GroupType,
  attendeeMemberIds: string[],
  courseHistory: CourseAssignment[],
): Record<string, AssignmentItem> {
  const slots = determineCourseSlots(groupType, attendeeMemberIds.length);

  const courseCountFor = (memberId: string, course: AssignmentItem) =>
    courseHistory.filter((h) => h.memberId === memberId && h.course === course).length;
  const totalCountFor = (memberId: string) => courseHistory.filter((h) => h.memberId === memberId).length;

  const remainingMembers = [...attendeeMemberIds];
  const remainingSlots = slots.map((course, idx) => ({ course, idx }));
  const assignment: Record<string, AssignmentItem> = {};

  while (remainingMembers.length > 0 && remainingSlots.length > 0) {
    let bestMemberIdx = -1;
    let bestSlotIdx = -1;
    let bestScore: Score | null = null;

    for (let mi = 0; mi < remainingMembers.length; mi++) {
      const memberId = remainingMembers[mi];
      for (let si = 0; si < remainingSlots.length; si++) {
        const course = remainingSlots[si].course;
        const score: Score = {
          courseCount: courseCountFor(memberId, course),
          totalCount: totalCountFor(memberId),
          memberId,
        };
        if (!bestScore || compareScore(score, bestScore) < 0) {
          bestScore = score;
          bestMemberIdx = mi;
          bestSlotIdx = si;
        }
      }
    }

    const memberId = remainingMembers[bestMemberIdx];
    const course = remainingSlots[bestSlotIdx].course;
    assignment[memberId] = course;
    remainingMembers.splice(bestMemberIdx, 1);
    remainingSlots.splice(bestSlotIdx, 1);
  }

  return assignment;
}

export function memberName(members: Member[], memberId: string): string {
  return members.find((m) => m.id === memberId)?.name ?? 'Onbekend lid';
}
