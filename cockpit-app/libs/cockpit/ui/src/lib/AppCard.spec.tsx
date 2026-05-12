import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@cockpit-app/shared-react-ui';
import { AppCard } from './AppCard';
import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LucideProps } from 'lucide-react';
import '@testing-library/jest-dom';

/**
 * Dummy icon component for testing purposes.
 */
// @ts-expect-error: Dummy icon for testing
const DummyIcon: ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
> = (props) => <svg data-testid="dummy-icon" {...props} />;

describe('AppCard', () => {
  it('renders title, description, and icon', () => {
    render(
      <AppCard
        title="Test App"
        description="This is a test app."
        url="/test-url"
        Icon={DummyIcon}
      />,
    );

    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('This is a test app.')).toBeInTheDocument();
    expect(screen.getByTestId('dummy-icon')).toBeInTheDocument();
  });

  it('renders link with correct href', () => {
    render(
      <AppCard
        title="Test App"
        description="This is a test app."
        url="/test-url"
        Icon={DummyIcon}
      />,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test-url');
  });

  it('renders disabled state without tooltip text', () => {
    render(
      <AppCard
        title="Disabled App"
        description="Disabled app."
        url="/disabled"
        Icon={DummyIcon}
        disabled={true}
      />,
    );
    expect(screen.getByText('Disabled App')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders disabled state with tooltip text', () => {
    render(
      <TooltipProvider>
        <AppCard
          title="Disabled App"
          description="Disabled app."
          url="/disabled"
          Icon={DummyIcon}
          disabled={true}
          disabledTooltipText="Coming soon"
        />
      </TooltipProvider>,
    );
    expect(screen.getByText('Disabled App')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
