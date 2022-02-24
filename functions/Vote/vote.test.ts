import Substitute, { Arg, SubstituteOf } from '@fluffy-spoon/substitute';

// must be imported before '.'
import uuidMock from '../common/uuidMock';

import httpTrigger, { VoteContext } from '.';
import { EventRow } from '../common/types';
import { datesToString } from '../common/parsers';

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
    const request = {
      body: {
        name: 'Dick',
        votes: ['2014-01-01', '2014-01-05'],
      },
      params: { eventId },
    };

    describe('when the event exists and there are existing votes', () => {
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

        await httpTrigger(contextMock, request);
      });

      it('creates a table entry', () => {
        bindingsMock.received().voteTable = [
          {
            PartitionKey: `vote_${eventId}`,
            RowKey: uuidMock.getLastGeneratedUUID(),
            Name: request.body.name,
            Votes: datesToString(request.body.votes),
          },
        ];
      });

      it('returns the event with all votes', () => {
        contextMock.received().res = {
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
        };
      });
    });

    describe('when the event exists and there are no votes yet', () => {
      beforeEach(async () => {
        bindingsMock.event.returns(event);
        bindingsMock.eventVotes.returns([]);

        await httpTrigger(contextMock, request);
      });

      it('creates a table entry', () => {
        bindingsMock.received().voteTable = [
          {
            PartitionKey: `vote_${eventId}`,
            RowKey: uuidMock.getLastGeneratedUUID(),
            Name: request.body.name,
            Votes: datesToString(request.body.votes),
          },
        ];
      });

      it('returns the event with all votes', () => {
        contextMock.received().res = {
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
        };
      });
    });

    describe('when the event does not exist', () => {
      beforeEach(async () => {
        bindingsMock.event.returns(undefined);
        bindingsMock.eventVotes.returns([]);

        await httpTrigger(contextMock, request);
      });

      it('creates no table entry', async () => {
        bindingsMock.didNotReceive().voteTable = Arg.any();
      });

      it('returns an error message', async () => {
        contextMock.received().res = {
          status: 404,
          body: {
            details: 'Event does not exist',
          },
        };
      });
    });
  });

  describe('when the input is invalid', () => {
    const request = {
      body: {
        name: 'Dick',
      },
      params: { eventId },
    };

    beforeEach(async () => {
      bindingsMock.event.returns(event);

      await httpTrigger(contextMock, request);
    });

    it('creates no table entry', async () => {
      bindingsMock.didNotReceive().voteTable = Arg.any();
    });

    it('returns an error message', async () => {
      contextMock.received().res = {
        status: 400,
        body: {
          details: 'Invalid vote dates',
        },
      };
    });
  });
});
