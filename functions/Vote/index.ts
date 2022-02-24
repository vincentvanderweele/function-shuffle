import * as uuid from 'uuid';
import { Context, HttpRequest } from '@azure/functions';
import { datesFromString, datesToString, parseVote } from '../common/parsers';
import { EventRow, EventWithVotes, Vote, VoteRow } from '../common/types';
import {
  createErrorResponse,
  createSuccessResponse,
  HttpResponse,
  NotFoundError,
  ValidationError,
} from '../common/httpHelpers';

export type VoteResult = HttpResponse<
  EventWithVotes,
  { voteTable?: VoteRow[] }
>;

export interface VoteContext extends Context {
  bindings: {
    event: EventRow | undefined;
    eventVotes: VoteRow[];
  };
}

const httpTrigger = async function (
  context: VoteContext,
  req: HttpRequest
): Promise<VoteResult> {
  const { eventId } = req.params;
  const { event, eventVotes } = context.bindings;

  context.log('Create vote', { eventId, body: req.body });

  if (!eventId || !event) {
    return createErrorResponse(new NotFoundError('Event does not exist'));
  }

  let vote: Vote;

  try {
    vote = parseVote(req.body);
  } catch (error: unknown) {
    const errorMessage = (error as { message: string })?.message;

    context.log('Failed to parse vote', { errorMessage });

    return createErrorResponse(error);
  }

  const eventDates = datesFromString(event.Dates);

  const invalidDates = vote.votes.filter((date) => !eventDates.includes(date));
  if (invalidDates.length) {
    context.log('Vote contains invalid dates', { invalidDates });

    return createErrorResponse(
      new ValidationError(`Invalid dates: ${invalidDates.join(', ')}`)
    );
  }

  const voteRow: VoteRow = {
    PartitionKey: `vote_${eventId}`,
    RowKey: uuid.v4(),
    Name: vote.name,
    Votes: datesToString(vote.votes),
  };

  context.log('Vote row created', { voteRow });

  return createSuccessResponse(
    createEventWithVotes(event, [...eventVotes, voteRow]),
    { voteTable: [voteRow] }
  );
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
