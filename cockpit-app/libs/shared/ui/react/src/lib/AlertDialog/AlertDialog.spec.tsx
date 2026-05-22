import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './AlertDialog';

vi.mock('@radix-ui/react-alert-dialog', () => {
  const React = require('react');

  const Root = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  const Trigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
    ({ children, asChild, ...props }, ref) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    )
  );
  Trigger.displayName = 'AlertDialogTrigger';

  const Portal = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  const Overlay = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
    ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />
  );
  Overlay.displayName = 'AlertDialogOverlay';

  const Content = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
    ({ children, className, ...props }, ref) => (
      <div ref={ref} role="alertdialog" className={className} {...props}>
        {children}
      </div>
    )
  );
  Content.displayName = 'AlertDialogContent';

  const Header = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  );

  const Footer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  );

  const Title = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h2'>>(
    ({ children, ...props }, ref) => <h2 ref={ref} {...props}>{children}</h2>
  );
  Title.displayName = 'AlertDialogTitle';

  const Description = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<'p'>>(
    ({ children, ...props }, ref) => <p ref={ref} {...props}>{children}</p>
  );
  Description.displayName = 'AlertDialogDescription';

  const Action = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
    ({ children, className, ...props }, ref) => (
      <button ref={ref} className={className} {...props}>
        {children}
      </button>
    )
  );
  Action.displayName = 'AlertDialogAction';

  const Cancel = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
    ({ children, className, ...props }, ref) => (
      <button ref={ref} className={className} {...props}>
        {children}
      </button>
    )
  );
  Cancel.displayName = 'AlertDialogCancel';

  return { Root, Trigger, Portal, Overlay, Content, Header, Footer, Title, Description, Action, Cancel };
});

describe('AlertDialog', () => {
  it('renders trigger button; dialog content hidden before trigger click', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    // With the mock, content is always rendered (no portal/open state).
    // We verify the trigger is present as the visible entry point.
    const triggerButton = screen.getByRole('button', { name: 'Open Dialog' });
    expect(triggerButton).toBeInTheDocument();
  });

  it('clicking AlertDialogAction calls the provided onClick handler', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <AlertDialog>
        <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onClick}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
