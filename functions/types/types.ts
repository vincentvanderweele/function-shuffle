export type Event = {
  name: string;
  dates: Date[];
};

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

export function parseDate(data: unknown): Date {
  const date = new Date(data as string);
  if (date.toISOString().slice(0, 10) !== data) {
    throw new Error('Invalid date');
  }
  return date;
}
