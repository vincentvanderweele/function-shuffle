import * as uuid from 'uuid';
import { AzureFunction, HttpRequest } from '@azure/functions';
import { Event, EventRow, HttpContext } from '../common/types';
import { parseEvent } from '../common/parsers';

export interface CreateEventContext extends HttpContext {
  bindings: {
    eventTable: EventRow[];
  };
}

const httpTrigger: AzureFunction = async function (
  context: CreateEventContext,
  req: HttpRequest
): Promise<void> {
  context.log('Create event', { body: req.body });

  let event: Event;

  try {
    event = parseEvent(req.body);
  } catch (error: unknown) {
    const errorMessage = (error as { message: string })?.message;

    context.log('Failed to parse event', { errorMessage });

    context.res = {
      status: 400,
      body: { ...(errorMessage ? { details: errorMessage } : {}) },
    };
    return;
  }

  const eventRow: EventRow = {
    PartitionKey: 'events',
    RowKey: uuid.v4(),
    Name: event.name,
    Dates: event.dates.join(','),
  };

  context.bindings.eventTable = [eventRow];

  context.log('Event row created', { eventRow });

  context.res = {
    status: 200,
    body: {
      id: eventRow.RowKey,
    },
  };
};

export default httpTrigger;
