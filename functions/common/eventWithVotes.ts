import { datesFromString } from './parsers';
import { EventRow, VoteRow, EventWithVotes } from './types';

export function createEventWithVotes(
  event: EventRow,
  votes: VoteRow[]
): EventWithVotes {
  // build a dictionary of people voting for each day
  const voteMap = votes.reduce((voteMap, vote) => {
    for (const date of datesFromString(vote.Votes)) {
      (voteMap[date] ?? (voteMap[date] = [])).push(vote.Name);
    }

    return voteMap;
  }, {} as Record<string, string[]>);

  return {
    id: event.RowKey,
    name: event.Name,
    dates: datesFromString(event.Dates),
    // turn the dictionary in a list of objects and sort by date
    votes: Object.entries(voteMap)
      .map(([date, people]) => ({ date, people }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
