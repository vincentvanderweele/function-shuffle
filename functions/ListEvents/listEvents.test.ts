import Substitute, { SubstituteOf } from '@fluffy-spoon/substitute';
import httpTrigger, { ListEventsContext } from '.';

describe('listEvents', () => {
  let contextMock: SubstituteOf<ListEventsContext>;
  let bindingsMock: SubstituteOf<ListEventsContext['bindings']>;

  beforeEach(() => {
    contextMock = Substitute.for<ListEventsContext>();
    bindingsMock = Substitute.for<ListEventsContext['bindings']>();

    contextMock.bindings.returns(bindingsMock);
  });

  it('returns all events from the table', async () => {
    bindingsMock.eventTable.returns([
      {
        PartitionKey: 'events',
        RowKey: 'id1',
        Name: 'Name 1',
        Dates: '2014-01-01,2014-01-05,2014-01-12',
      },
      {
        PartitionKey: 'events',
        RowKey: 'id2',
        Name: 'Name 2',
        Dates: '2014-01-01,2014-01-05,2014-01-12',
      },
    ]);

    await httpTrigger(contextMock);

    contextMock.received().res = {
      status: 200,
      body: [
        {
          id: 'id1',
          name: 'Name 1',
        },
        {
          id: 'id2',
          name: 'Name 2',
        },
      ],
    };
  });

  it('returns an empty array when the table is empty', async () => {
    bindingsMock.eventTable.returns([]);

    await httpTrigger(contextMock);

    contextMock.received().res = {
      status: 200,
      body: [],
    };
  });
});
