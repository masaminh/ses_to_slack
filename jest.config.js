module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  maxWorkers: 10,
  snapshotSerializers: ['<rootDir>/test/snapshot-plugin.ts'],
}
