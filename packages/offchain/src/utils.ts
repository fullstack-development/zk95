import { type Script } from 'lucid-cardano';

import blueprint from '@mixer/onchain' assert { type: 'json' };

export function readValidator(
  name: (typeof blueprint)['validators'][number]['title']
): Script {
  const validator = blueprint.validators.find(
    (validator) => validator.title === name
  );

  if (validator) {
    return {
      type: 'PlutusV2',
      script: validator.compiledCode,
    };
  }

  throw new Error(`Validator with name: ${name} is not found`);
}
