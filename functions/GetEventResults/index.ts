import { Context, HttpRequest } from '@azure/functions';
import { createEventWithResults } from '../common/eventHelpers';
import {
  createErrorResponse,
  createSuccessResponse,
  HttpResponse,
  NotFoundError,
} from '../common/httpHelpers';
import { EventRow, EventWithResults, VoteRow } from '../common/types';

export type GetEventResultsResult = HttpResponse<EventWithResults>;

export interface GetEventResultsContext extends Context {
  bindings: {
    event: EventRow | undefined;
    eventVotes: VoteRow[];
  };
}

const httpTrigger = async function (
  context: GetEventResultsContext,
  req: HttpRequest
): Promise<GetEventResultsResult> {
  const { eventId } = req.params;
  const { event, eventVotes } = context.bindings;

  context.log('Get event results', { eventId });

  if (!eventId || !event) {
    return createErrorResponse(new NotFoundError('Event does not exist'));
  }

  return createSuccessResponse(createEventWithResults(event, eventVotes));
};

export default httpTrigger;
