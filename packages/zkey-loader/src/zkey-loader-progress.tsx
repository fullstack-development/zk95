import { injectable } from '@mixer/injectable';
import { ProgressBar } from 'react95';
import { mkZKeyLoader } from './model';
import { useProperty } from '@frp-ts/react';
import { combineEff } from '@mixer/eff';

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
