import { ValidationError } from './httpHelpers';
import { EventCreate, VoteCreate } from './types';

export function parseEvent(data: unknown): EventCreate {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Event is not an object');
  }

  const event = data as EventCreate;
  if (!event.name || typeof event.name !== 'string') {
    throw new ValidationError('Invalid event name');
  }

  if (!event.dates || !Array.isArray(event.dates)) {
    throw new ValidationError('Invalid event dates');
  }

  return {
    name: event.name,
    dates: event.dates.map(parseDate),
  };
}

export function parseVote(data: unknown): VoteCreate {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Vote is not an object');
  }

  const vote = data as VoteCreate;
  if (!vote.name || typeof vote.name !== 'string') {
    throw new ValidationError('Invalid voter name');
  }

  if (!vote.votes || !Array.isArray(vote.votes)) {
    throw new ValidationError('Invalid vote dates');
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
    throw new ValidationError('Invalid date format');
  }

  // invalid date, for instance '2000-02-30'
  if (isNaN(Date.parse(data))) {
    throw new ValidationError('Invalid date');
  }

  return data;
}

export function datesToString(dates: string[]): string {
  return dates.join(',');
}

export function datesFromString(dates: string): string[] {
  return dates.split(',');
}
