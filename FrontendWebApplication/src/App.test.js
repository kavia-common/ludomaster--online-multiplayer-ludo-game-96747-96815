import { render } from '@testing-library/react';
import Root from './Root';

test('renders app shell without crashing', () => {
  render(<Root />);
});
