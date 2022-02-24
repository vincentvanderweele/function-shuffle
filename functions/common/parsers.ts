import { Event, Vote } from './types';
export function parseEvent(data: unknown): Event {
  if (!data || typeof data !== 'object') {
    throw new Error('Event is not an object');
  }

  const event = data as Event;
  if (!event.name || typeof event.name !== 'string') {
    throw new Error('Invalid event name');
  }

  if (!event.dates || !Array.isArray(event.dates)) {
    throw new Error('Invalid event dates');
  }

  return {
    name: event.name,
    dates: event.dates.map(parseDate),
  };
}

export function parseVote(data: unknown): Vote {
  if (!data || typeof data !== 'object') {
    throw new Error('Vote is not an object');
  }

  const vote = data as Vote;
  if (!vote.name || typeof vote.name !== 'string') {
    throw new Error('Invalid voter name');
  }

  if (!vote.votes || !Array.isArray(vote.votes)) {
    throw new Error('Invalid vote dates');
  }

  return {
    name: vote.name,
    votes: vote.votes.map(parseDate),
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

export function datesToString(dates: string[]): string {
  return dates.join(',');
}

export function datesFromString(dates: string): string[] {
  return dates.split(',');
}
