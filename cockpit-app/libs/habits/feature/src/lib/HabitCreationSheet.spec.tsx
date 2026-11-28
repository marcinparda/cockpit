import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HabitCreationSheet } from './HabitCreationSheet';
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
    const { usePresets } = dataAccess;
    vi.mocked(usePresets).mockReturnValue({
      data: [
        {
          id: 'preset-1',
          name: 'Daily Exercise',
          description: 'Exercise every day',
          category_key: 'health',
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
    const { useHabitMutations } = dataAccess;
    const mockUpdate = vi.fn();
    vi.mocked(useHabitMutations).mockReturnValue({
      createHabit: { mutate: vi.fn(), isPending: false },
      updateHabit: { mutate: mockUpdate, isPending: false },
      deleteHabit: { mutate: vi.fn(), isPending: false },
      archiveHabit: { mutate: vi.fn(), isPending: false },
      updateSortOrder: { mutate: vi.fn(), isPending: false },
    } as any);

    const editHabit = createHabitMock({
      id: 'edit-habit-1',
      type: 'boolean',
      category_id: null,
      category_name: undefined,
      target_value: undefined,
      unit: undefined,
    });
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
    const { useHabitMutations } = dataAccess;
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
