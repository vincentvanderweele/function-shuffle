// mock uuid generation before it gets imported
const uuid = 'a3dafe57-c103-4984-b3dd-20995f27f785';
jest.mock('uuid', () => ({ v4: () => uuid }));

import Substitute, { Arg, SubstituteOf } from '@fluffy-spoon/substitute';
import httpTrigger, { CreateEventContext } from '.';
import { EventRow } from '../common/types';

describe('createEvent', () => {
  let contextMock: SubstituteOf<CreateEventContext>;
  let bindingsMock: SubstituteOf<CreateEventContext['bindings']>;

  beforeEach(() => {
    contextMock = Substitute.for<CreateEventContext>();
    bindingsMock = Substitute.for<CreateEventContext['bindings']>();

    contextMock.bindings.returns(bindingsMock);
  });

  describe('when the input is valid', () => {
    const request = {
      body: {
        name: "Jake's secret party",
        dates: ['2014-01-01', '2014-01-05', '2014-01-12'],
      },
    };

    beforeEach(async () => {
      await httpTrigger(contextMock, request);
    });

    it('creates a table entry', () => {
      bindingsMock.received().eventTable = [
        {
          PartitionKey: 'events',
          RowKey: uuid,
          Name: request.body.name,
          Dates: request.body.dates.join(','),
        },
      ];
    });

    it('returns the event id', () => {
      contextMock.received().res = {
        status: 200,
        body: {
          id: uuid,
        },
      };
    });
  });

  describe('when the input is invalid', () => {
    const request = {
      body: {
        name: "Jake's secret party without dates",
      },
    };

    beforeEach(async () => {
      await httpTrigger(contextMock, request);
    });

    it('creates no table entry', async () => {
      bindingsMock.didNotReceive().eventTable = Arg.any();
    });

    it('returns an error message', async () => {
      contextMock.received().res = {
        status: 400,
        body: {
          details: 'Invalid event dates',
        },
      };
    });
  });
});
