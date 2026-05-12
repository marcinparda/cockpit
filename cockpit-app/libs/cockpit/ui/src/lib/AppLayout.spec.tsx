import { render, screen } from '@testing-library/react';
import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  it('renders children inside main', () => {
    render(<AppLayout><span>page content</span></AppLayout>);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('renders header when header prop provided', () => {
    render(
      <AppLayout header={<span>Header content</span>}>
        <span>body</span>
      </AppLayout>,
    );
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('does not render header element when header prop is absent', () => {
    render(<AppLayout><span>body</span></AppLayout>);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('renders children in main region', () => {
    render(<AppLayout><p>Main body</p></AppLayout>);
    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByText('Main body'));
  });
});
