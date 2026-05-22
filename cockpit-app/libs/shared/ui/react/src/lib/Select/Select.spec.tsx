import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';

// Capture the onValueChange callback from the Select root
let capturedOnValueChange: ((value: string) => void) | undefined;

vi.mock('@radix-ui/react-select', () => {
  const React = require('react');

  const Root = ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
  }) => {
    capturedOnValueChange = onValueChange;
    return <div>{children}</div>;
  };

  const Trigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
    ({ children, className, ...props }, ref) => (
      <button ref={ref} className={className} {...props}>
        {children}
      </button>
    )
  );
  Trigger.displayName = 'SelectTrigger';

  const Value = ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  );

  const Portal = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  const Content = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  );

  const Viewport = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  const Item = React.forwardRef<
    HTMLDivElement,
    { value: string; children: React.ReactNode }
  >(({ value, children, ...props }, ref) => (
    <div
      ref={ref}
      role="option"
      data-value={value}
      onClick={() => capturedOnValueChange?.(value)}
      {...props}
    >
      {children}
    </div>
  ));
  Item.displayName = 'SelectItem';

  const ItemText = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;
  const ItemIndicator = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;
  const Icon = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;
  const ScrollUpButton = () => null;
  const ScrollDownButton = () => null;

  return {
    Root,
    Trigger,
    Value,
    Portal,
    Content,
    Viewport,
    Item,
    ItemText,
    ItemIndicator,
    Icon,
    ScrollUpButton,
    ScrollDownButton,
  };
});

describe('Select', () => {
  it('renders SelectTrigger with placeholder text visible', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('selecting an option calls onValueChange with the selected value', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    await user.click(screen.getByRole('option', { name: 'Option 1' }));

    expect(onValueChange).toHaveBeenCalledWith('option1');
  });
});
