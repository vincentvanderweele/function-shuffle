import { HttpRequest } from '@azure/functions';
import Substitute, { SubstituteOf } from '@fluffy-spoon/substitute';

// must be imported before '.'
import uuidMock from '../common/uuidMock';

import httpTrigger, { VoteContext, VoteResult } from '.';
import { datesToString } from '../common/parsers';
import { EventRow } from '../common/types';

describe('createEvent', () => {
  const eventId = 'a3dafe57-c103-4984-b3dd-20995f27f785';
  const event: EventRow = {
    PartitionKey: 'events',
    RowKey: eventId,
    Name: "Jake's secret party",
    Dates: datesToString(['2014-01-01', '2014-01-05', '2014-01-12']),
  };

  let contextMock: SubstituteOf<VoteContext>;
  let bindingsMock: SubstituteOf<VoteContext['bindings']>;

  beforeEach(() => {
    contextMock = Substitute.for<VoteContext>();
    bindingsMock = Substitute.for<VoteContext['bindings']>();

    contextMock.bindings.returns(bindingsMock);
  });

  describe('when the input is valid', () => {
    const requestBody = {
      name: 'Dick',
      votes: ['2014-01-01', '2014-01-05'],
    };
    let request: SubstituteOf<HttpRequest>;

    beforeEach(() => {
      request = Substitute.for<HttpRequest>();
      request.body.returns(requestBody);
      request.params.returns({ eventId });
    });

    describe('when the event exists and there are existing votes', () => {
      let result: VoteResult;

      beforeEach(async () => {
        bindingsMock.event.returns({
          PartitionKey: 'events',
          RowKey: eventId,
          Name: "Jake's secret party",
          Dates: '2014-01-01,2014-01-05,2014-01-12',
        });
        bindingsMock.eventVotes.returns(
          ['John', 'Julia', 'Paul', 'Daisy'].map((name) => ({
            PartitionKey: `vote_${eventId}`,
            RowKey: '',
            Name: name,
            Votes: '2014-01-01',
          }))
        );

        result = await httpTrigger(contextMock, request);
      });

      it('creates a table entry', () => {
        expect(result.voteTable).toEqual([
          {
            PartitionKey: `vote_${eventId}`,
            RowKey: uuidMock.getLastGeneratedUUID(),
            Name: requestBody.name,
            Votes: datesToString(requestBody.votes),
          },
        ]);
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
      let result: VoteResult;

      beforeEach(async () => {
        bindingsMock.event.returns(event);
        bindingsMock.eventVotes.returns([]);

        result = await httpTrigger(contextMock, request);
      });

      it('creates a table entry', () => {
        expect(result.voteTable).toEqual([
          {
            PartitionKey: `vote_${eventId}`,
            RowKey: uuidMock.getLastGeneratedUUID(),
            Name: request.body.name,
            Votes: datesToString(request.body.votes),
          },
        ]);
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
                people: ['Dick'],
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

    describe('when the event does not exist', () => {
      let result: VoteResult;

      beforeEach(async () => {
        bindingsMock.event.returns(undefined);
        bindingsMock.eventVotes.returns([]);

        result = await httpTrigger(contextMock, request);
      });

      it('creates no table entry', async () => {
        expect(result.voteTable).toBeUndefined();
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

  describe('when the input is invalid', () => {
    let result: VoteResult;

    beforeEach(async () => {
      bindingsMock.event.returns(event);

      const request = Substitute.for<HttpRequest>();
      request.body.returns({ name: 'Dick' });
      request.params.returns({ eventId });

      result = await httpTrigger(contextMock, request);
    });

    it('creates no table entry', async () => {
      expect(result.voteTable).toBeUndefined();
    });

    it('returns an error message', async () => {
      expect(result.httpResponse).toEqual({
        status: 400,
        body: {
          details: 'Invalid vote dates',
        },
      });
    });
  });
});
