import { render } from '@testing-library/react';

import Notifier from './notifier';

describe('Notifier', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Notifier />);
    expect(baseElement).toBeTruthy();
  });
});
