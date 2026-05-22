import { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { useHabits } from '../api/hooks/useHabits';
import { useHabitMutations } from '../api/hooks/useHabitMutations';
import { Habit } from '../api/schemas';
import { SortableCategoryGroup } from '../components/SortableCategoryGroup';
import { HabitCreationSheet } from '../components/HabitCreationSheet';
import { ManageCategoriesSheet } from '../components/ManageCategoriesSheet';

interface CategoryGroup {
  name: string;
  habits: Habit[];
}

function groupByCategory(habits: Habit[]): CategoryGroup[] {
  const map = new Map<string, Habit[]>();

  for (const habit of habits) {
    const key = habit.category_name ?? 'Uncategorized';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(habit);
  }

  // Named categories first, then Uncategorized
  const groups: CategoryGroup[] = [];
  for (const [name, group] of map.entries()) {
    if (name !== 'Uncategorized') {
      groups.push({ name, habits: group });
    }
  }
  const uncategorized = map.get('Uncategorized');
  if (uncategorized) {
    groups.push({ name: 'Uncategorized', habits: uncategorized });
  }
  return groups;
}

export default function HabitsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | undefined>(undefined);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const { data: habits = [], isLoading } = useHabits();
  const { archiveHabit, updateSortOrder } = useHabitMutations();

  const filtered = habits.filter((h) =>
    showArchived ? true : !h.is_archived,
  );

  const groups = groupByCategory(filtered);

  function handleEdit(habit: Habit) {
    setEditHabit(habit);
    setSheetOpen(true);
  }

  function handleArchive(habit: Habit) {
    archiveHabit.mutate({ id: habit.id, is_archived: !habit.is_archived });
  }

  function handleReorder(id: string, newSortOrder: number) {
    updateSortOrder.mutate({ id, sort_order: newSortOrder });
  }

  function handleSheetClose() {
    setSheetOpen(false);
    setEditHabit(undefined);
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Habits</h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCategoriesOpen(true)}
            aria-label="Manage categories"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Tag size={14} />
            Categories
          </button>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              aria-label="Show archived"
              className="h-4 w-4 rounded"
            />
            Show archived
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" aria-label="Loading" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-testid="empty-habits"
          className="flex flex-col items-center gap-3 py-16 text-gray-500"
        >
          <p className="text-lg">No habits yet</p>
          <p className="text-sm">Tap + to add your first habit</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <SortableCategoryGroup
              key={group.name}
              categoryName={group.name}
              habits={group.habits}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onReorder={handleReorder}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => {
          setEditHabit(undefined);
          setSheetOpen(true);
        }}
        aria-label="Add habit"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      {sheetOpen && (
        <HabitCreationSheet onClose={handleSheetClose} editHabit={editHabit} />
      )}

      {categoriesOpen && (
        <ManageCategoriesSheet onClose={() => setCategoriesOpen(false)} />
      )}
    </div>
  );
}
