import { ALL_COURSES, CORE_COURSES, type Course, type CourseAssignment, type Member } from '../types';

const SHORTAGE_PRIORITY: Course[] = ['hoofdgerecht', 'voorgerecht', 'nagerecht', 'borrelhapje'];

/**
 * Bepaalt welke gangen er die avond gedaan worden, 1 slot per aanwezige.
 * - 4+ aanwezigen: alle 4 gangen (incl. borrelhapje), extra aanwezigen delen gangen (team van 2).
 * - <4 aanwezigen: kernnagangen (voor/hoofd/na), bij tekort eerst hoofdgerecht, dan voor-, dan nagerecht.
 * - Meer aanwezigen dan gangtypes: gangen worden herhaald (round robin) zodat iedereen een slot heeft.
 */
export function determineCourseSlots(attendeeCount: number): Course[] {
  if (attendeeCount <= 0) return [];

  const baseCourses = attendeeCount >= 4 ? ALL_COURSES : CORE_COURSES;

  if (attendeeCount < baseCourses.length) {
    return SHORTAGE_PRIORITY.filter((c) => baseCourses.includes(c)).slice(0, attendeeCount);
  }

  const slots: Course[] = [];
  for (let i = 0; i < attendeeCount; i++) {
    slots.push(baseCourses[i % baseCourses.length]);
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
 * Verdeelt de gangslots eerlijk over de aanwezige leden, op basis van de
 * geschiedenis van eerdere kookavonden in de groep (courseHistory).
 *
 * Greedy min-cost matching: kiest steeds de (lid, gang)-combinatie waarbij dat
 * lid die specifieke gang het minst vaak eerder deed (bij gelijke stand: wie
 * in totaal het minst vaak een gang deed, dan alfabetisch voor determinisme).
 */
export function assignCourses(
  attendeeMemberIds: string[],
  courseHistory: CourseAssignment[],
): Record<string, Course> {
  const slots = determineCourseSlots(attendeeMemberIds.length);

  const courseCountFor = (memberId: string, course: Course) =>
    courseHistory.filter((h) => h.memberId === memberId && h.course === course).length;
  const totalCountFor = (memberId: string) => courseHistory.filter((h) => h.memberId === memberId).length;

  const remainingMembers = [...attendeeMemberIds];
  const remainingSlots = slots.map((course, idx) => ({ course, idx }));
  const assignment: Record<string, Course> = {};

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
