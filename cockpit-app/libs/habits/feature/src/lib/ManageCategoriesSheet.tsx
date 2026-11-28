import { useState } from 'react';
import { X, Pencil, Trash2, Check, Plus } from 'lucide-react';
import { ColorSwatchPicker } from '@cockpit-app/habits-ui';
import {
  Button,
  Input,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@cockpit-app/shared-react-ui';
import {
  HabitCategory,
  useCategories,
  useCategoryMutations,
} from '@cockpit-app/habits-data-access';

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
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-label="Manage categories" className="h-[80vh] gap-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>Manage Categories</SheetTitle>
        </SheetHeader>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {categories.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No categories yet</p>
          )}

          <ul className="flex flex-col gap-2">
            {categories.map((cat) =>
              editing?.id === cat.id ? (
                /* Inline edit row */
                <li
                  key={cat.id}
                  className="flex items-center gap-2 rounded-xl border p-2"
                >
                  <ColorSwatchPicker
                    colors={COLORS}
                    value={editing.color}
                    onChange={(c) => setEditing((e) => e && { ...e, color: c })}
                    size="sm"
                    className="flex-nowrap"
                  />
                  <Input
                    type="text"
                    value={editing.name}
                    onChange={(e) =>
                      setEditing((prev) => prev && { ...prev, name: e.target.value })
                    }
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    autoFocus
                    className="h-8 flex-1"
                    aria-label="Category name"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={saveEdit}
                    disabled={updateCategory.isPending}
                    aria-label="Save"
                    className="size-8 rounded-full text-green-600"
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(null)}
                    aria-label="Cancel"
                    className="size-8 rounded-full"
                  >
                    <X size={16} />
                  </Button>
                </li>
              ) : (
                /* Display row */
                <li
                  key={cat.id}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2"
                >
                  <span
                    className="h-4 w-4 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color ?? '#6b7280' }}
                  />
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(cat)}
                    aria-label={`Edit ${cat.name}`}
                    className="size-8 rounded-full"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(cat)}
                    aria-label={`Delete ${cat.name}`}
                    disabled={deleteCategory.isPending}
                    className="size-8 rounded-full text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </li>
              ),
            )}
          </ul>

          <Separator className="my-4" />

          {/* Create new category */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Add New Category</h3>

            <ColorSwatchPicker
              colors={COLORS}
              value={newColor}
              onChange={setNewColor}
              size="md"
            />

            {/* Name input */}
            <div className="flex gap-2">
              <Input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (e.target.value.trim()) setCreateError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Category name"
                aria-label="New category name"
                aria-invalid={createError ? true : undefined}
                aria-describedby={createError ? 'create-error' : undefined}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleCreate}
                disabled={createCategory.isPending}
                aria-label="Create category"
              >
                <Plus size={16} />
                Add
              </Button>
            </div>

            {createError && (
              <p id="create-error" className="text-sm text-destructive">
                {createError}
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
