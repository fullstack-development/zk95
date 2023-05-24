import styles from './mixer.module.css';

/* eslint-disable-next-line */
export interface DepositProps { }

export function DepositForm(props: DepositProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to Deposit!</h1>
    </div>
  );
}

