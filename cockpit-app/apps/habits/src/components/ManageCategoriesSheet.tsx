import { useState } from 'react';
import { X, Pencil, Trash2, Check, Plus } from 'lucide-react';
import { useCategories, useCategoryMutations } from '../api/hooks/useCategories';
import { HabitCategory } from '../api/schemas';

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
];

interface ManageCategoriesSheetProps {
  onClose: () => void;
}

interface EditState {
  id: string;
  name: string;
  color: string;
}

export function ManageCategoriesSheet({ onClose }: ManageCategoriesSheetProps) {
  const { data: categories = [] } = useCategories();
  const { createCategory, updateCategory, deleteCategory } = useCategoryMutations();

  const [editing, setEditing] = useState<EditState | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [createError, setCreateError] = useState('');

  function startEdit(cat: HabitCategory) {
    setEditing({ id: cat.id, name: cat.name, color: cat.color ?? '#3b82f6' });
  }

  function saveEdit() {
    if (!editing || !editing.name.trim()) return;
    updateCategory.mutate(
      { id: editing.id, name: editing.name.trim(), color: editing.color },
      { onSuccess: () => setEditing(null) },
    );
  }

  function handleDelete(cat: HabitCategory) {
    deleteCategory.mutate(cat.id);
  }

  function handleCreate() {
    if (!newName.trim()) {
      setCreateError('Name is required');
      return;
    }
    setCreateError('');
    createCategory.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setNewName('');
          setNewColor('#3b82f6');
        },
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manage categories"
      className="fixed inset-0 z-[60] flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="relative flex h-[80vh] w-full flex-col rounded-t-2xl bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Manage Categories</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {categories.length === 0 && (
            <p className="text-center text-sm text-gray-500">No categories yet</p>
          )}

          <ul className="flex flex-col gap-2">
            {categories.map((cat) =>
              editing?.id === cat.id ? (
                /* Inline edit row */
                <li
                  key={cat.id}
                  className="flex items-center gap-2 rounded-xl border p-2 dark:border-gray-700"
                >
                  <div className="flex gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={c}
                        aria-pressed={editing.color === c}
                        onClick={() => setEditing((e) => e && { ...e, color: c })}
                        className={`h-5 w-5 rounded-full border-2 ${
                          editing.color === c
                            ? 'border-gray-900 dark:border-white'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) =>
                      setEditing((prev) => prev && { ...prev, name: e.target.value })
                    }
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    autoFocus
                    className="flex-1 rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                    aria-label="Category name"
                  />
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={updateCategory.isPending}
                    aria-label="Save"
                    className="rounded-full p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    aria-label="Cancel"
                    className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X size={16} />
                  </button>
                </li>
              ) : (
                /* Display row */
                <li
                  key={cat.id}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2 dark:border-gray-700"
                >
                  <span
                    className="h-4 w-4 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color ?? '#6b7280' }}
                  />
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    aria-label={`Edit ${cat.name}`}
                    className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    aria-label={`Delete ${cat.name}`}
                    disabled={deleteCategory.isPending}
                    className="rounded-full p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ),
            )}
          </ul>

          {/* Divider */}
          <div className="my-4 border-t dark:border-gray-700" />

          {/* Create new category */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Add New Category
            </h3>

            {/* Color picker */}
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={newColor === c}
                  onClick={() => setNewColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    newColor === c
                      ? 'scale-110 border-gray-900 dark:border-white'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Name input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (e.target.value.trim()) setCreateError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Category name"
                aria-label="New category name"
                aria-describedby={createError ? 'create-error' : undefined}
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={createCategory.isPending}
                aria-label="Create category"
                className="flex items-center gap-1 rounded-xl bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {createError && (
              <p id="create-error" className="text-sm text-red-500">
                {createError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
