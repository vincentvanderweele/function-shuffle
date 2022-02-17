import { Event } from './types';
export function parseEvent(data: unknown): Event {
  if (!data || typeof data !== 'object') {
    throw new Error('Data is not an object');
  }

  const event = data as Event;
  if (!event.name || typeof event.name !== 'string') {
    throw new Error('Invalid event name');
  }

  return {
    name: event.name,
    dates: event.dates.map(parseDate),
  };
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(data: unknown): string {
  // completely wrong data
  if (typeof data !== 'string' || !dateRegex.test(data)) {
    throw new Error('Invalid date format');
  }

  // invalid date, for instance '2000-02-30'
  if (isNaN(Date.parse(data))) {
    throw new Error('Invalid date');
  }

  return data;
}
