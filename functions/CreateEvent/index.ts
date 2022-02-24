import * as uuid from 'uuid';
import { Context, HttpRequest } from '@azure/functions';
import { Event, EventId, EventRow } from '../common/types';
import { datesToString, parseEvent } from '../common/parsers';
import {
  createErrorResponse,
  createSuccessResponse,
  HttpResponse,
} from '../common/httpHelpers';

export type CreateEventResult = HttpResponse<
  EventId,
  { eventTable?: EventRow[] }
>;

const httpTrigger = async function (
  context: Context,
  req: HttpRequest
): Promise<CreateEventResult> {
  context.log('Create event', { body: req.body });

  let event: Event;

  try {
    event = parseEvent(req.body);
  } catch (error: unknown) {
    const errorMessage = (error as { message: string })?.message;

    context.log('Failed to parse event', { errorMessage });

    return createErrorResponse(error);
  }

  const eventId = uuid.v4();

  context.log('Creating event row', { eventId });

  return createSuccessResponse(
    { id: eventId },
    {
      eventTable: [
        {
          PartitionKey: 'events',
          RowKey: eventId,
          Name: event.name,
          Dates: datesToString(event.dates),
        },
      ],
    }
  );
};

export default httpTrigger;
