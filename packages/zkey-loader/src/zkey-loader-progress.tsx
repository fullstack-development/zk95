import { ProgressBar } from 'react95';
import { useProperty } from '@frp-ts/react';

import { injectable } from '@mixer/injectable';
import { combineEff } from '@mixer/eff';

import { mkZKeyLoader } from './service';

export const zKeyLoadingProgressBar = injectable(
  mkZKeyLoader,
  combineEff((zkLoader) => () => {
    const progress = useProperty(zkLoader.progressStatus$);
    return (
      <ProgressBar
        value={
          progress.type === 'loading'
            ? progress.progress
            : progress.type === 'success'
            ? 100
            : 0
        }
      />
    );
  })
);
