import { Context, HttpRequest } from '@azure/functions';
import * as uuid from 'uuid';
import { createEventWithVotes } from '../common/eventWithVotes';
import {
  createErrorResponse,
  createSuccessResponse,
  HttpResponse,
  NotFoundError,
  ValidationError,
} from '../common/httpHelpers';
import { datesFromString, datesToString, parseVote } from '../common/parsers';
import { EventRow, EventWithVotes, VoteCreate, VoteRow } from '../common/types';

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

  let vote: VoteCreate;

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
