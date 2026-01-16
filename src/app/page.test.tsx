import { render, screen } from '@testing-library/react';
import Home from './page';
it('renders primary actions', () => {
  render(<Home />);
  expect(screen.getByText(/Open Registration Form/i)).toBeInTheDocument();
  expect(screen.getByText(/Open Activity Tracking/i)).toBeInTheDocument();
});
