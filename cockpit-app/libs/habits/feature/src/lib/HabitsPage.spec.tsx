import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HabitsPage } from './HabitsPage';
import * as dataAccess from '@cockpit-app/habits-data-access';

// Mock hooks before imports
vi.mock('@cockpit-app/habits-data-access', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCategories: vi.fn(() => ({ data: [], isLoading: false })),
  useCategoryMutations: vi.fn(() => ({
    createCategory: { mutate: vi.fn(), isPending: false },
    updateCategory: { mutate: vi.fn(), isPending: false },
    deleteCategory: { mutate: vi.fn(), isPending: false },
  })),
  useHabitMutations: vi.fn(() => ({
    createHabit: { mutate: vi.fn(), isPending: false },
    updateHabit: { mutate: vi.fn(), isPending: false },
    deleteHabit: { mutate: vi.fn(), isPending: false },
    archiveHabit: { mutate: vi.fn(), isPending: false },
    updateSortOrder: { mutate: vi.fn(), isPending: false },
  })),
  usePresets: vi.fn(() => ({ data: [], isLoading: false })),
  useHabits: vi.fn(() => ({ data: [], isLoading: false })),
}));

const { createHabitMock } = dataAccess;

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function withProviders(ui: React.ReactElement) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

const baseHabit = createHabitMock({ id: 'habit-1' });

// Test 1: HabitCreationSheet Quick Add form validation
describe('HabitsPage', () => {
  beforeEach(() => {
    vi.mocked(dataAccess.useHabits).mockReturnValue({
      data: [
        { ...baseHabit, id: 'h1', name: 'Active Habit', is_archived: false },
        { ...baseHabit, id: 'h2', name: 'Archived Habit', is_archived: true },
      ],
      isLoading: false,
    } as any);
  });

  it('shows archive toggle and filters archived habits', () => {
    render(withProviders(<HabitsPage />));

    // Active habit should be visible
    expect(screen.getByText('Active Habit')).toBeInTheDocument();

    // Archived habit should not be visible initially
    expect(screen.queryByText('Archived Habit')).not.toBeInTheDocument();

    // Toggle to show archived
    const archiveToggle = screen.getByRole('checkbox', {
      name: /show archived/i,
    });
    fireEvent.click(archiveToggle);

    // Now archived habit should be visible
    expect(screen.getByText('Archived Habit')).toBeInTheDocument();
  });

  it('shows a loading spinner while habits load', () => {
    vi.mocked(dataAccess.useHabits).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(withProviders(<HabitsPage />));

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('opens Manage categories from the header', () => {
    render(withProviders(<HabitsPage />));

    fireEvent.click(screen.getByRole('button', { name: 'Manage categories' }));

    expect(screen.getByRole('dialog', { name: 'Manage categories' })).toBeInTheDocument();
  });

  it('shows empty state when no habits exist', () => {
    vi.mocked(dataAccess.useHabits).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(withProviders(<HabitsPage />));

    expect(screen.getByTestId('empty-habits')).toBeInTheDocument();
  });

  it('opens HabitCreationSheet when FAB is clicked', () => {
    vi.mocked(dataAccess.useHabits).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(withProviders(<HabitsPage />));

    const fab = screen.getByRole('button', { name: /add habit/i });
    fireEvent.click(fab);

    // Sheet should open — the HabitCreationSheet is rendered
    expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
  });
});
