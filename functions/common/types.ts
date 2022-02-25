import { Context } from '@azure/functions';

export interface EventCreate {
  name: string;
  dates: string[];
}

export interface VoteCreate {
  name: string;
  votes: string[];
}

export interface Event {
  id: string;
  name: string;
}

export type EventId = Pick<Event, 'id'>;

export interface EventWithVotes extends Event {
  dates: string[];
  votes: Array<{
    date: string;
    people: string[];
  }>;
}

export interface EventWithResults extends Event {
  suitableDates: Array<{
    date: string;
    people: string[];
  }>;
}

export interface TableRow {
  PartitionKey: string;
  RowKey: string;
}

export interface EventRow extends TableRow {
  Name: string;
  Dates: string;
}

export interface VoteRow extends TableRow {
  Name: string;
  Votes: string;
}

export interface HttpContext extends Context {
  res: {
    status: number;
    body: {};
  };
}
