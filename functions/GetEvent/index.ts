import { Context, HttpRequest } from '@azure/functions';
import { createEventWithVotes } from '../common/eventWithVotes';
import {
  createErrorResponse,
  createSuccessResponse,
  HttpResponse,
  NotFoundError,
} from '../common/httpHelpers';
import { EventWithVotes, EventRow, VoteRow } from '../common/types';

export type GetEventResult = HttpResponse<EventWithVotes>;

export interface GetEventContext extends Context {
  bindings: {
    event: EventRow | undefined;
    eventVotes: VoteRow[];
  };
}

const httpTrigger = async function (
  context: GetEventContext,
  req: HttpRequest
): Promise<GetEventResult> {
  const { eventId } = req.params;
  const { event, eventVotes } = context.bindings;

  context.log('Get event', { eventId });

  if (!eventId || !event) {
    return createErrorResponse(new NotFoundError('Event does not exist'));
  }

  return createSuccessResponse(createEventWithVotes(event, eventVotes));
};

export default httpTrigger;
