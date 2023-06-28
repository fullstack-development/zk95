const jest = require('jest');

const config = process.argv[2];

jest.run(['--config', config]);
