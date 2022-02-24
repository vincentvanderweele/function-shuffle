import { Context } from '@azure/functions';

export interface Event {
  name: string;
  dates: string[];
}

export interface Vote {
  name: string;
  votes: string[];
}

export interface EventWithVotes {
  id: string;
  name: string;
  dates: string[];
  votes: Array<{
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
