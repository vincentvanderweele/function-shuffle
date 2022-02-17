import { Context } from '@azure/functions';

export interface Event {
  name: string;
  dates: string[];
}

export interface TableRow {
  PartitionKey: string;
  RowKey: string;
}

export interface EventRow extends TableRow {
  Name: string;
  Dates: string;
}

export interface HttpContext extends Context {
  res: {
    status: number;
    body: {};
  };
}
