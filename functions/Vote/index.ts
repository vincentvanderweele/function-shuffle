import * as uuid from 'uuid';
import { AzureFunction, HttpRequest } from '@azure/functions';
import { datesFromString, datesToString, parseVote } from '../common/parsers';
import {
  EventRow,
  EventWithVotes,
  HttpContext,
  Vote,
  VoteRow,
} from '../common/types';

export interface VoteContext extends HttpContext {
  bindings: {
    event: EventRow | undefined;
    eventVotes: VoteRow[];
    voteTable: VoteRow[];
  };
}

const httpTrigger: AzureFunction = async function (
  context: VoteContext,
  req: HttpRequest
): Promise<void> {
  const { eventId } = req.params;
  const { event, eventVotes } = context.bindings;

  context.log('Create vote', { eventId, body: req.body });

  if (!eventId || !event) {
    context.res = {
      status: 404,
      body: {
        details: 'Event does not exist',
      },
    };

    return;
  }

  let vote: Vote;

  try {
    vote = parseVote(req.body);
  } catch (error: unknown) {
    const errorMessage = (error as { message: string })?.message;

    context.log('Failed to parse vote', { errorMessage });

    context.res = {
      status: 400,
      body: { ...(errorMessage ? { details: errorMessage } : {}) },
    };
    return;
  }

  const eventDates = datesFromString(event.Dates);

  const invalidDates = vote.votes.filter((date) => !eventDates.includes(date));
  if (invalidDates.length) {
    context.log('Vote contains invalid dates', { invalidDates });

    context.res = {
      status: 400,
      body: { details: `Invalid dates: ${invalidDates.join(', ')}` },
    };
    return;
  }

  const voteRow: VoteRow = {
    PartitionKey: `vote_${eventId}`,
    RowKey: uuid.v4(),
    Name: vote.name,
    Votes: datesToString(vote.votes),
  };

  context.bindings.voteTable = [voteRow];

  context.log('Vote row created', { voteRow });

  context.res = {
    status: 200,
    body: createEventWithVotes(event, [...eventVotes, voteRow]),
  };
};

export default httpTrigger;

function createEventWithVotes(
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
