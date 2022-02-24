import { Context } from '@azure/functions';
import { createSuccessResponse, HttpResponse } from '../common/httpHelpers';
import { EventRow, EventWithName } from '../common/types';

export type ListEventsResult = HttpResponse<EventWithName[]>;

export interface ListEventsContext extends Context {
  bindings: {
    eventTable: EventRow[];
  };
}

const httpTrigger = async function (
  context: ListEventsContext
): Promise<ListEventsResult> {
  const eventRows = context.bindings.eventTable;

  context.log(eventRows);

  const events = eventRows.map(({ RowKey, Name }) => ({
    id: RowKey,
    name: Name,
  }));

  context.log('List events', { events });

  return createSuccessResponse(events);
};

export default httpTrigger;
