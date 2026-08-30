import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../api/hooks/useEntryMutations', () => ({
  useEntryMutations: vi.fn(),
}));

import * as useEntryMutationsModule from '../api/hooks/useEntryMutations';
import { HabitSheet } from '../components/HabitSheet';
import { createHabitMock } from '../mocks/habit';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function withQueryClient(ui: React.ReactElement) {
  return <QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>;
}

const mockUpsertMutate = vi.fn();

const baseHabit = createHabitMock({
  id: 'habit-numeric-1',
  name: 'Drink Water',
  icon: 'droplet',
  color: '#0ea5e9',
  type: 'numeric',
  current_streak: 0,
  best_streak: 0,
  target_value: 8,
  unit: 'glasses',
});

describe('HabitSheet', () => {
  beforeEach(() => {
    vi.mocked(useEntryMutationsModule.useEntryMutations).mockReturnValue({
      upsertEntry: { mutate: mockUpsertMutate },
      deleteEntry: { mutate: vi.fn() },
    } as any);
    mockUpsertMutate.mockClear();
  });

  it('renders numeric input and confirm button for numeric type', () => {
    const onClose = vi.fn();
    render(
      withQueryClient(
        <HabitSheet habit={baseHabit} todayEntry={null} onClose={onClose} />,
      ),
    );

    expect(screen.getByLabelText(/Value/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
  });

  it('shows progress bar when numeric value is entered and target_value is set', () => {
    const onClose = vi.fn();
    render(
      withQueryClient(
        <HabitSheet habit={baseHabit} todayEntry={null} onClose={onClose} />,
      ),
    );

    const input = screen.getByLabelText(/Value/i);
    fireEvent.change(input, { target: { value: '4' } });

    // Progress bar rendered as a div with bg-blue-500
    const progressBar = document.querySelector('.bg-blue-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('calls upsertEntry with numeric_value when Confirm is clicked', () => {
    const onClose = vi.fn();
    render(
      withQueryClient(
        <HabitSheet habit={baseHabit} todayEntry={null} onClose={onClose} />,
      ),
    );

    const input = screen.getByLabelText(/Value/i);
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    expect(mockUpsertMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        habitId: 'habit-numeric-1',
        numeric_value: 5,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call upsertEntry when Confirm is clicked with invalid numeric input', () => {
    const onClose = vi.fn();
    render(
      withQueryClient(
        <HabitSheet habit={baseHabit} todayEntry={null} onClose={onClose} />,
      ),
    );

    // Leave input empty — parseFloat('') = NaN
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    expect(mockUpsertMutate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('renders textarea for text type habit', () => {
    const textHabit = { ...baseHabit, id: 'habit-text-1', type: 'text' as const };
    const onClose = vi.fn();
    render(
      withQueryClient(
        <HabitSheet habit={textHabit} todayEntry={null} onClose={onClose} />,
      ),
    );

    expect(screen.getByRole('textbox', { name: /Diary entry/i })).toBeInTheDocument();
  });

  it('calls upsertEntry with text_value on textarea blur', () => {
    const textHabit = { ...baseHabit, id: 'habit-text-1', type: 'text' as const };
    const onClose = vi.fn();
    render(
      withQueryClient(
        <HabitSheet habit={textHabit} todayEntry={null} onClose={onClose} />,
      ),
    );

    const textarea = screen.getByRole('textbox', { name: /Diary entry/i });
    fireEvent.change(textarea, { target: { value: 'Great day today' } });
    fireEvent.blur(textarea);

    expect(mockUpsertMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        habitId: 'habit-text-1',
        text_value: 'Great day today',
      }),
    );
  });

  it('closes the sheet when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      withQueryClient(
        <HabitSheet habit={baseHabit} todayEntry={null} onClose={onClose} />,
      ),
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalled();
  });
});
