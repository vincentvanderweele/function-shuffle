import { datesFromString } from './parsers';
import { EventRow, EventWithResults, EventWithVotes, VoteRow } from './types';

export function createEventWithVotes(
  event: EventRow,
  votes: VoteRow[]
): EventWithVotes {
  const eventDates = datesFromString(event.Dates);
  const votersByDate = getVotersByDate(eventDates, votes);

  return {
    id: event.RowKey,
    name: event.Name,
    dates: eventDates,
    // turn the dictionary in a list of objects and sort by date
    // only keep dates that have at least one voter
    votes: Object.entries(votersByDate)
      .map(([date, people]) => ({ date, people }))
      .filter(({ people }) => people.length > 0)
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function createEventWithResults(
  event: EventRow,
  votes: VoteRow[]
): EventWithResults {
  const eventDates = datesFromString(event.Dates);
  const votersByDate = getVotersByDate(eventDates, votes);

  return {
    id: event.RowKey,
    name: event.Name,
    // turn the dictionary in a list of objects and sort by date
    // only keep the dates that were chosen by all voters
    suitableDates: Object.entries(votersByDate)
      .map(([date, people]) => ({ date, people }))
      .filter(({ people }) => people.length === votes.length)
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function getVotersByDate(
  eventDates: string[],
  votes: VoteRow[]
): Record<string, string[]> {
  return votes.reduce((voteMap, vote) => {
    for (const date of datesFromString(vote.Votes)) {
      voteMap[date].push(vote.Name);
    }

    return voteMap;
  }, Object.fromEntries(eventDates.map((date) => [date, []])));
}
