import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts'],
    maxWorkers: 10,
    testTimeout: 10000,
    snapshotSerializers: ['./test/snapshot-plugin.ts'],
  },
})
