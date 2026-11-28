import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import * as dataAccess from '@cockpit-app/habits-data-access';
import { ManageCategoriesSheet } from './ManageCategoriesSheet';
import { createCategoryMock } from '@cockpit-app/habits-data-access';

vi.mock('@cockpit-app/habits-data-access', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCategories: vi.fn(),
  useCategoryMutations: vi.fn(),
}));

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

const categories = [
  createCategoryMock({ id: 'cat-1', name: 'Health', color: '#22c55e' }),
  createCategoryMock({ id: 'cat-2', name: 'Work', color: undefined }),
];

describe('ManageCategoriesSheet', () => {
  beforeEach(() => {
    vi.mocked(dataAccess.useCategories).mockReturnValue({
      data: categories,
    } as any);
    vi.mocked(dataAccess.useCategoryMutations).mockReturnValue({
      createCategory: { mutate: mockCreateMutate, isPending: false },
      updateCategory: { mutate: mockUpdateMutate, isPending: false },
      deleteCategory: { mutate: mockDeleteMutate, isPending: false },
    } as any);
    mockCreateMutate.mockClear();
    mockUpdateMutate.mockClear();
    mockDeleteMutate.mockClear();
  });

  it('renders existing categories', () => {
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('shows empty state when there are no categories', () => {
    vi.mocked(dataAccess.useCategories).mockReturnValue({
      data: [],
    } as any);
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    expect(screen.getByText('No categories yet')).toBeInTheDocument();
  });

  it('closes when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<ManageCategoriesSheet onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(<ManageCategoriesSheet onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('is a dialog named Manage categories', () => {
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Manage categories' })).toBeInTheDocument();
  });

  it('shows validation error when creating with an empty name', () => {
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Create category'));
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('creates a category with the entered name and selected color', () => {
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('New category name'), {
      target: { value: 'Fitness' },
    });
    fireEvent.click(screen.getByLabelText('#f97316'));
    fireEvent.click(screen.getByLabelText('Create category'));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      { name: 'Fitness', color: '#f97316' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('starts editing a category and saves the new name', () => {
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Edit Health'));

    const nameInput = screen.getByLabelText('Category name');
    fireEvent.change(nameInput, { target: { value: 'Wellness' } });
    fireEvent.click(screen.getByLabelText('Save'));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { id: 'cat-1', name: 'Wellness', color: '#22c55e' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('cancels editing without saving', () => {
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Edit Health'));
    fireEvent.click(screen.getByLabelText('Cancel'));

    expect(screen.queryByLabelText('Category name')).not.toBeInTheDocument();
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });

  it('deletes a category when delete is clicked', () => {
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Delete Health'));
    expect(mockDeleteMutate).toHaveBeenCalledWith('cat-1');
  });

  it('clears the create form when creation succeeds', () => {
    mockCreateMutate.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<ManageCategoriesSheet onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('New category name'), {
      target: { value: 'Fitness' },
    });
    fireEvent.click(screen.getByLabelText('Create category'));

    expect(screen.getByLabelText('New category name')).toHaveValue('');
  });

  it('exits edit mode when the update succeeds', () => {
    mockUpdateMutate.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<ManageCategoriesSheet onClose={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('Edit Health'));
    fireEvent.click(screen.getByLabelText('Save'));

    expect(screen.queryByLabelText('Category name')).not.toBeInTheDocument();
  });

  it('saves edit when Enter is pressed in the name field', () => {
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Edit Health'));
    fireEvent.keyDown(screen.getByLabelText('Category name'), { key: 'Enter' });
    expect(mockUpdateMutate).toHaveBeenCalled();
  });

  it('creates category when Enter is pressed in the new name field', () => {
    render(<ManageCategoriesSheet onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('New category name'), {
      target: { value: 'Fitness' },
    });
    fireEvent.keyDown(screen.getByLabelText('New category name'), { key: 'Enter' });
    expect(mockCreateMutate).toHaveBeenCalled();
  });
});
