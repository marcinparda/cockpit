import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { LogRow } from './LogRow';

function setup(value: 'done' | 'notDone' | 'unset' = 'unset') {
  const handlers = {
    onSelectDone: vi.fn(),
    onSelectNotDone: vi.fn(),
    onRowClick: vi.fn(),
  };
  render(
    <LogRow
      icon={<svg data-testid="icon" />}
      color="#ff0000"
      title="Run"
      subtitle="3/8"
      value={value}
      {...handlers}
    />,
  );
  return handlers;
}

describe('LogRow', () => {
  it('renders title, subtitle and icon', () => {
    setup();
    expect(screen.getByText('Run')).toBeInTheDocument();
    expect(screen.getByText('3/8')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('fires callbacks independently', () => {
    const h = setup();
    fireEvent.click(screen.getByLabelText('Mark Run done'));
    fireEvent.click(screen.getByLabelText('Mark Run not done'));
    expect(h.onSelectDone).toHaveBeenCalledTimes(1);
    expect(h.onSelectNotDone).toHaveBeenCalledTimes(1);
    expect(h.onRowClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Run'));
    expect(h.onRowClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['done', 'true', 'false'],
    ['notDone', 'false', 'true'],
    ['unset', 'false', 'false'],
  ] as const)('reflects %s state', (value, done, notDone) => {
    setup(value);
    expect(screen.getByTestId('log-row')).toHaveAttribute('data-value', value);
    expect(screen.getByLabelText('Mark Run done')).toHaveAttribute('aria-pressed', done);
    expect(screen.getByLabelText('Mark Run not done')).toHaveAttribute('aria-pressed', notDone);
  });
});
