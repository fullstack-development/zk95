import styles from './notifier.module.css';

/* eslint-disable-next-line */
export interface NotifierProps {}

export function Notifier(props: NotifierProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to Notifier!</h1>
    </div>
  );
}

export default Notifier;
