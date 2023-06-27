/* eslint-disable */
export default {
  displayName: 'offchain',
  // preset: '../../jest.preset.js',
  transform: {
    // '^.+\\.(js|ts)$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  transformIgnorePatterns: ['node_modules/(?!lucid-cardano)'],
  coverageDirectory: '../../coverage/packages/offchain',
};
