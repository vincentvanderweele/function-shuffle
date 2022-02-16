import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { parseEvent } from '../types/types';

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log('Create event');

  try {
    const event = parseEvent(req.body);

    context.res = {
      body: event,
    };
  } catch (error: unknown) {
    const errorMessage = (error as { message: string })?.message;

    context.res = {
      status: 400,
      ...(errorMessage ? { body: { details: errorMessage } } : {}),
    };
  }
};

export default httpTrigger;
