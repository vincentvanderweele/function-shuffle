import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { EventRow, HttpContext } from '../common/types';

export interface ListEventsContext extends HttpContext {
  bindings: {
    eventTable: EventRow[];
  };
}

const httpTrigger: AzureFunction = async function (
  context: ListEventsContext,
  req: HttpRequest
): Promise<void> {
  const eventRows = context.bindings.eventTable;

  context.log(eventRows);

  const events = eventRows.map(({ RowKey, Name }) => ({
    id: RowKey,
    name: Name,
  }));

  context.log('List events', { events });

  context.res = {
    status: 200,
    body: events,
  };
};

export default httpTrigger;
