import { ThemeProvider } from 'styled-components';
import { Button, Monitor, Select } from 'react95';
import { WindowsIcon } from '@mixer/icons';
import { Window } from '@mixer/components';
import { token, useDependency } from '@mixer/react-injectable';
import {
  MonitorContent,
  MonitorDesktop,
  MonitorWindow,
  AppBar,
  MainContent,
  ThemeSelectBox,
  Footer,
} from './styled';
import {
  CUSTOMIZE_VIEW_MODEL,
  CustomizeViewModel,
  ThemeKey,
} from './view-model';
import { useMemo, useState } from 'react';
import { SelectOption } from 'react95/dist/Select/Select.types';

export function Customizer() {
  const { selectedTheme$, setTheme, themes } = useDependency(
    token(CUSTOMIZE_VIEW_MODEL)<CustomizeViewModel>()
  );

  const [selectedLocalTheme, setLocalTheme] = useState<ThemeKey>(
    selectedTheme$.get()
  );

  const options = useMemo(
    () =>
      Object.keys(themes).map((themeKey) => ({
        label: themeKey,
        value: themeKey,
      })) as SelectOption<ThemeKey>[],
    [themes]
  );

  return (
    <MainContent>
      <Monitor>
        <ThemeProvider theme={themes[selectedLocalTheme]}>
          <MonitorContent>
            <MonitorDesktop>
              <MonitorWindow>
                <Window title="Title">Some Text</Window>
              </MonitorWindow>
            </MonitorDesktop>
            <div>
              <AppBar position="static">
                <Button>
                  <img
                    src={WindowsIcon}
                    alt="start"
                    style={{ height: '20px', marginRight: 4 }}
                  />{' '}
                  Start
                </Button>
              </AppBar>
            </div>
          </MonitorContent>
        </ThemeProvider>
      </Monitor>
      <ThemeSelectBox label="Theme">
        <Select<ThemeKey>
          value={selectedLocalTheme}
          options={options}
          onChange={({ value }) => setLocalTheme(value)}
          menuMaxHeight={200}
        />
      </ThemeSelectBox>
      <Footer>
        <Button onClick={() => setTheme(selectedLocalTheme)}>
          Apply Theme
        </Button>
      </Footer>
    </MainContent>
  );
}

export default Customizer;
