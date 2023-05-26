import { Monitor } from 'react95';
import themes from 'react95/dist/themes'
import { Window } from '@mixer/components'
import { ThemeProvider } from 'styled-components';

export interface CustomizerProps {
  //
}

export function Customizer(props: CustomizerProps) {
  return (
    <Window>
      <ThemeProvider theme={themes.aiee}>
        <Monitor></Monitor>
      </ThemeProvider>
      <h1>Welcome to Customizer!</h1>
    </Window>
  );
}

export default Customizer;
