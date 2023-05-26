import styles from './desktop.module.css';

/* eslint-disable-next-line */
export interface DesktopProps {}

export function Desktop(props: DesktopProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to Desktop!</h1>
    </div>
  );
}

export default Desktop;
