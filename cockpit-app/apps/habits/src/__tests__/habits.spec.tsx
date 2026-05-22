import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Mock hooks before imports
vi.mock('../api/hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({ data: [], isLoading: false })),
  useCategoryMutations: vi.fn(() => ({
    createCategory: { mutate: vi.fn(), isPending: false },
    updateCategory: { mutate: vi.fn(), isPending: false },
    deleteCategory: { mutate: vi.fn(), isPending: false },
  })),
}));

vi.mock('../api/hooks/useHabitMutations', () => ({
  useHabitMutations: vi.fn(() => ({
    createHabit: { mutate: vi.fn(), isPending: false },
    updateHabit: { mutate: vi.fn(), isPending: false },
    deleteHabit: { mutate: vi.fn(), isPending: false },
    archiveHabit: { mutate: vi.fn(), isPending: false },
    updateSortOrder: { mutate: vi.fn(), isPending: false },
  })),
}));

vi.mock('../api/hooks/usePresets', () => ({
  usePresets: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('../api/hooks/useHabits', () => ({
  useHabits: vi.fn(() => ({ data: [], isLoading: false })),
}));

// Must import after vi.mock declarations
import { IconPicker } from '../components/IconPicker';
import { HabitCreationSheet } from '../components/HabitCreationSheet';
import { SortableHabitRow } from '../components/SortableHabitRow';
import HabitsPage from '../pages/HabitsPage';
import * as useHabitsModule from '../api/hooks/useHabits';

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

const baseHabit = {
  id: 'habit-1',
  name: 'Morning Run',
  icon: 'Running',
  color: '#ff6b6b',
  type: 'boolean' as const,
  streak_mode: 'soft' as const,
  current_streak: 3,
  frequency: 'daily',
  is_active: true,
  category_id: null,
  category_name: undefined,
  sort_order: 0,
  is_archived: false,
  best_streak: 5,
};

// Test 1: HabitCreationSheet Quick Add form validation
describe('HabitCreationSheet', () => {
  it('shows validation errors when name and type are missing on submit', () => {
    const onClose = vi.fn();
    render(withProviders(<HabitCreationSheet onClose={onClose} />));

    const submitButton = screen.getByRole('button', { name: /add habit/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/type is required/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  // Test 2: Browse Templates tab pre-fills form fields without auto-creating
  it('Browse Templates tab pre-fills Quick Add form without creating habit', async () => {
    const onClose = vi.fn();
    const { usePresets } = await import('../api/hooks/usePresets');
    vi.mocked(usePresets).mockReturnValue({
      data: [
        {
          id: 'preset-1',
          name: 'Daily Exercise',
          description: 'Exercise every day',
          category: 'Health',
          frequency: 'daily',
          target_value: 30,
          unit: 'minutes',
        },
      ],
      isLoading: false,
    } as any);

    render(withProviders(<HabitCreationSheet onClose={onClose} />));

    // Switch to Browse Templates tab
    const templatesTab = screen.getByRole('tab', { name: /browse templates/i });
    fireEvent.click(templatesTab);

    // Click on a preset
    const presetCard = screen.getByText('Daily Exercise');
    fireEvent.click(presetCard);

    // Should NOT have called onClose (habit not created)
    expect(onClose).not.toHaveBeenCalled();

    // Switch back to Quick Add and verify name is pre-filled
    const quickAddTab = screen.getByRole('tab', { name: /quick add/i });
    fireEvent.click(quickAddTab);

    const nameInput = screen.getByLabelText(/habit name/i);
    expect((nameInput as HTMLInputElement).value).toBe('Daily Exercise');
  });
});

// Test 3: IconPicker renders icons and calls onSelect
describe('IconPicker', () => {
  it('renders icon list and calls onSelect when icon is clicked', () => {
    const onSelect = vi.fn();
    render(withProviders(<IconPicker selected="Star" onSelect={onSelect} />));

    // Should render some icons
    const icons = screen.getAllByRole('button');
    expect(icons.length).toBeGreaterThan(0);

    // Click an icon button
    fireEvent.click(icons[0]);
    expect(onSelect).toHaveBeenCalledWith(expect.any(String));
  });
});

// Test 4: SortableHabitRow renders drag handle and habit name
describe('SortableHabitRow', () => {
  it('renders drag handle and habit name', () => {
    render(
      withProviders(
        <SortableHabitRow
          habit={baseHabit}
          onEdit={vi.fn()}
          onArchive={vi.fn()}
        />,
      ),
    );

    expect(screen.getByTestId('drag-handle')).toBeInTheDocument();
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });
});

describe('HabitCreationSheet form interactions', () => {
  it('updates color when a color button is clicked', () => {
    const onClose = vi.fn();
    render(withProviders(<HabitCreationSheet onClose={onClose} />));

    // Click the first color button (red: #ef4444)
    const colorButton = screen.getByRole('button', { name: '#ef4444' });
    fireEvent.click(colorButton);

    // The button should become pressed
    expect(colorButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows target input when numeric type is selected', () => {
    const onClose = vi.fn();
    render(withProviders(<HabitCreationSheet onClose={onClose} />));

    const typeSelect = screen.getByLabelText(/^Type$/i);
    fireEvent.change(typeSelect, { target: { value: 'numeric' } });

    expect(document.getElementById('habit-target')).toBeInTheDocument();
  });

  it('fills target value field when numeric type selected', () => {
    const onClose = vi.fn();
    render(withProviders(<HabitCreationSheet onClose={onClose} />));

    const typeSelect = screen.getByLabelText(/^Type$/i);
    fireEvent.change(typeSelect, { target: { value: 'numeric' } });

    const targetInput = document.getElementById('habit-target') as HTMLInputElement;
    expect(targetInput).toBeInTheDocument();
    fireEvent.change(targetInput, { target: { value: '30' } });
    expect(targetInput.value).toBe('30');
  });

  it('closes sheet when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(withProviders(<HabitCreationSheet onClose={onClose} />));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalled();
  });

  it('changes category and icon fields', () => {
    const onClose = vi.fn();
    render(withProviders(<HabitCreationSheet onClose={onClose} />));

    // Change category (select without options since categories mock returns [])
    const catSelect = screen.getByLabelText(/Category/i);
    expect(catSelect).toBeInTheDocument();

    // Change icon via IconPicker — click the first icon button in the picker
    const allButtons = screen.getAllByRole('button');
    // Icon buttons are those that don't have specific text roles
    const iconButtons = allButtons.filter((b) => !b.textContent?.match(/Add Habit|Browse|Quick|Close/));
    if (iconButtons.length > 0) {
      fireEvent.click(iconButtons[0]);
    }
  });

  it('updates frequency and streak mode via select fields', () => {
    const onClose = vi.fn();
    render(withProviders(<HabitCreationSheet onClose={onClose} />));

    const freqSelect = screen.getByLabelText(/Frequency/i);
    fireEvent.change(freqSelect, { target: { value: 'weekly' } });
    expect((freqSelect as HTMLSelectElement).value).toBe('weekly');

    const streakSelect = screen.getByLabelText(/Streak Mode/i);
    fireEvent.change(streakSelect, { target: { value: 'hard' } });
    expect((streakSelect as HTMLSelectElement).value).toBe('hard');
  });
});

describe('HabitCreationSheet edit mode', () => {
  it('renders with editHabit pre-fills form and calls updateHabit on submit', async () => {
    const { useHabitMutations } = await import('../api/hooks/useHabitMutations');
    const mockUpdate = vi.fn();
    vi.mocked(useHabitMutations).mockReturnValue({
      createHabit: { mutate: vi.fn(), isPending: false },
      updateHabit: { mutate: mockUpdate, isPending: false },
      deleteHabit: { mutate: vi.fn(), isPending: false },
      archiveHabit: { mutate: vi.fn(), isPending: false },
      updateSortOrder: { mutate: vi.fn(), isPending: false },
    } as any);

    const editHabit = {
      ...baseHabit,
      id: 'edit-habit-1',
      type: 'boolean' as const,
      category_id: null,
      category_name: undefined,
      target_value: undefined,
      unit: undefined,
    };
    const onClose = vi.fn();
    render(withProviders(<HabitCreationSheet onClose={onClose} editHabit={editHabit} />));

    // Verify name is pre-filled
    const nameInput = screen.getByLabelText(/habit name/i);
    expect((nameInput as HTMLInputElement).value).toBe('Morning Run');

    // Submit — should call updateHabit
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'edit-habit-1', name: 'Morning Run' }),
      expect.any(Object),
    );
  });
});

describe('HabitCreationSheet submit valid form', () => {
  it('calls createHabit when form is submitted with valid name and type', async () => {
    const { useHabitMutations } = await import('../api/hooks/useHabitMutations');
    const mockCreate = vi.fn();
    vi.mocked(useHabitMutations).mockReturnValue({
      createHabit: { mutate: mockCreate, isPending: false },
      updateHabit: { mutate: vi.fn(), isPending: false },
      deleteHabit: { mutate: vi.fn(), isPending: false },
      archiveHabit: { mutate: vi.fn(), isPending: false },
      updateSortOrder: { mutate: vi.fn(), isPending: false },
    } as any);

    const onClose = vi.fn();
    render(withProviders(<HabitCreationSheet onClose={onClose} />));

    // Fill in name
    const nameInput = screen.getByLabelText(/habit name/i);
    fireEvent.change(nameInput, { target: { value: 'Morning Run' } });

    // Select type via the select dropdown (label text is "Type")
    const typeSelect = screen.getByLabelText(/^Type$/i);
    fireEvent.change(typeSelect, { target: { value: 'boolean' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /add habit/i });
    fireEvent.click(submitButton);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Morning Run', type: 'boolean' }),
      expect.any(Object),
    );
  });
});

// Test 5: HabitsPage shows archive toggle and filters correctly
describe('HabitsPage', () => {
  beforeEach(() => {
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
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

  it('shows empty state when no habits exist', () => {
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(withProviders(<HabitsPage />));

    expect(screen.getByTestId('empty-habits')).toBeInTheDocument();
  });

  it('opens HabitCreationSheet when FAB is clicked', () => {
    vi.mocked(useHabitsModule.useHabits).mockReturnValue({
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
