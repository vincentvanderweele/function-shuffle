let generatedUUIDs: string[] = [];

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');
  return {
    ...actual,
    v4: () => {
      const uuid = actual.v4();
      generatedUUIDs.push(uuid);
      return uuid;
    },
  };
});

const uuidMock: {
  generatedUUIDs: Readonly<string[]>;
  getLastGeneratedUUID: () => string;
  reset: () => void;
} = {
  generatedUUIDs,
  getLastGeneratedUUID: () => generatedUUIDs[generatedUUIDs.length - 1],
  reset: () => {},
};

export default uuidMock;
