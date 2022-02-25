import { HttpRequest } from '@azure/functions';
import Substitute, { SubstituteOf } from '@fluffy-spoon/substitute';

import httpTrigger, { GetEventContext, GetEventResult } from '.';
import { datesToString } from '../common/parsers';
import { EventRow } from '../common/types';

describe('getEvent', () => {
  const eventId = 'a3dafe57-c103-4984-b3dd-20995f27f785';
  const event: EventRow = {
    PartitionKey: 'events',
    RowKey: eventId,
    Name: "Jake's secret party",
    Dates: datesToString(['2014-01-01', '2014-01-05', '2014-01-12']),
  };

  let contextMock: SubstituteOf<GetEventContext>;
  let bindingsMock: SubstituteOf<GetEventContext['bindings']>;
  let request: SubstituteOf<HttpRequest>;

  beforeEach(() => {
    contextMock = Substitute.for<GetEventContext>();
    bindingsMock = Substitute.for<GetEventContext['bindings']>();

    contextMock.bindings.returns(bindingsMock);

    request = Substitute.for<HttpRequest>();
    request.params.returns({ eventId });
  });

  describe('when the event exists and there are existing votes', () => {
    let result: GetEventResult;

    beforeEach(async () => {
      bindingsMock.event.returns({
        PartitionKey: 'events',
        RowKey: eventId,
        Name: "Jake's secret party",
        Dates: '2014-01-01,2014-01-05,2014-01-12',
      });
      bindingsMock.eventVotes.returns([
        ...['John', 'Julia', 'Paul', 'Daisy'].map((name) => ({
          PartitionKey: `vote_${eventId}`,
          RowKey: '',
          Name: name,
          Votes: '2014-01-01',
        })),
        {
          PartitionKey: `vote_${eventId}`,
          RowKey: '',
          Name: 'Dick',
          Votes: datesToString(['2014-01-01', '2014-01-05']),
        },
      ]);

      result = await httpTrigger(contextMock, request);
    });

    it('returns the event with all votes', () => {
      expect(result.httpResponse).toEqual({
        status: 200,
        body: {
          id: eventId,
          name: "Jake's secret party",
          dates: ['2014-01-01', '2014-01-05', '2014-01-12'],
          votes: [
            {
              date: '2014-01-01',
              people: ['John', 'Julia', 'Paul', 'Daisy', 'Dick'],
            },
            {
              date: '2014-01-05',
              people: ['Dick'],
            },
          ],
        },
      });
    });
  });

  describe('when the event exists and there are no votes yet', () => {
    let result: GetEventResult;

    beforeEach(async () => {
      bindingsMock.event.returns(event);
      bindingsMock.eventVotes.returns([]);

      result = await httpTrigger(contextMock, request);
    });

    it('returns the event with an empty list of votes', () => {
      expect(result.httpResponse).toEqual({
        status: 200,
        body: {
          id: eventId,
          name: "Jake's secret party",
          dates: ['2014-01-01', '2014-01-05', '2014-01-12'],
          votes: [],
        },
      });
    });
  });

  describe('when the event does not exist', () => {
    let result: GetEventResult;

    beforeEach(async () => {
      bindingsMock.event.returns(undefined);
      bindingsMock.eventVotes.returns([]);

      result = await httpTrigger(contextMock, request);
    });

    it('returns an error message', async () => {
      expect(result.httpResponse).toEqual({
        status: 404,
        body: {
          details: 'Event does not exist',
        },
      });
    });
  });
});
