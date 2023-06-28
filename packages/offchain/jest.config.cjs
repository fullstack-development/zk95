const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../tsconfig.base.json');

module.exports = {
  displayName: 'offchain',
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.[jt]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.spec.json',
        compiler: 'typescript',
      },
    ],
  },
  modulePathIgnorePatterns: [
    '<rootDir>/../../dist/',
    '<rootDir>/../../node_modules/',
  ],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../../',
    useESM: true,
  }),
};
