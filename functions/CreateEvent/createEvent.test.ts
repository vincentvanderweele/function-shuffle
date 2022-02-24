import { Context, HttpRequest } from '@azure/functions';
import Substitute, { SubstituteOf } from '@fluffy-spoon/substitute';

// must be imported before '.'
import uuidMock from '../common/uuidMock';

import httpTrigger, { CreateEventResult } from '.';
import { datesToString } from '../common/parsers';

describe('createEvent', () => {
  let contextMock: SubstituteOf<Context>;

  beforeEach(() => {
    contextMock = Substitute.for<Context>();
  });

  describe('when the input is valid', () => {
    const requestBody = {
      name: "Jake's secret party",
      dates: ['2014-01-01', '2014-01-05', '2014-01-12'],
    };

    let result: CreateEventResult;

    beforeEach(async () => {
      const request = Substitute.for<HttpRequest>();
      request.body.returns(requestBody);

      result = await httpTrigger(contextMock, request);
    });

    it('creates a table entry', () => {
      expect(result.eventTable).toEqual([
        {
          PartitionKey: 'events',
          RowKey: uuidMock.getLastGeneratedUUID(),
          Name: requestBody.name,
          Dates: datesToString(requestBody.dates),
        },
      ]);
    });

    it('returns the event id', () => {
      expect(result.httpResponse).toEqual({
        status: 200,
        body: {
          id: uuidMock.getLastGeneratedUUID(),
        },
      });
    });
  });

  describe('when the input is invalid', () => {
    const requestBody = {
      name: "Jake's secret party without dates",
    };

    let result: CreateEventResult;

    beforeEach(async () => {
      const request = Substitute.for<HttpRequest>();
      request.body.returns(requestBody);

      result = await httpTrigger(contextMock, request);
    });

    it('creates no table entry', async () => {
      expect(result.eventTable).toBeUndefined();
    });

    it('returns an error message', async () => {
      expect(result.httpResponse).toEqual({
        status: 400,
        body: {
          details: 'Invalid event dates',
        },
      });
    });
  });
});
