import type { DatePollOption, Vote, VoteResponse } from '../types';

export interface OptionTally {
  option: DatePollOption;
  ja: number;
  nee: number;
  misschien: number;
}

export function tallyOptions(options: DatePollOption[], votes: Vote[]): OptionTally[] {
  return options.map((option) => {
    const optionVotes = votes.filter((v) => v.pollOptionId === option.id);
    const count = (r: VoteResponse) => optionVotes.filter((v) => v.response === r).length;
    return { option, ja: count('ja'), nee: count('nee'), misschien: count('misschien') };
  });
}

/** Optie met de meeste "ja"-stemmen. Bij gelijke stand: eerst op minste "nee", dan op volgorde in de lijst. */
export function leadingOption(tallies: OptionTally[]): OptionTally | undefined {
  if (tallies.length === 0) return undefined;
  return [...tallies].sort((a, b) => b.ja - a.ja || a.nee - b.nee)[0];
}
