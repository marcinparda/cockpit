import { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import {
  Habit,
  useHabitMutations,
  useHabits,
} from '@cockpit-app/habits-data-access';
import {
  Checkbox,
  PageHeader,
  SortableCategoryGroup,
  Spinner,
} from '@cockpit-app/habits-ui';
import { Button } from '@cockpit-app/shared-react-ui';
import { HabitCreationSheet } from './HabitCreationSheet';
import { ManageCategoriesSheet } from './ManageCategoriesSheet';

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

export function HabitsPage() {
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
      <PageHeader
        title="Habits"
        className="mb-4"
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCategoriesOpen(true)}
              aria-label="Manage categories"
              className="text-muted-foreground"
            >
              <Tag size={14} />
              Categories
            </Button>

            <Checkbox checked={showArchived} onCheckedChange={setShowArchived}>
              Show archived
            </Checkbox>
          </>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-testid="empty-habits"
          className="flex flex-col items-center gap-3 py-16 text-muted-foreground"
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

      {/* FAB: sits above the shell's mobile bottom nav */}
      <Button
        type="button"
        size="icon"
        onClick={() => {
          setEditHabit(undefined);
          setSheetOpen(true);
        }}
        aria-label="Add habit"
        className="fixed bottom-20 right-4 size-14 rounded-full shadow-lg"
      >
        <Plus className="size-6" aria-hidden="true" />
      </Button>

      {sheetOpen && (
        <HabitCreationSheet onClose={handleSheetClose} editHabit={editHabit} />
      )}

      {categoriesOpen && (
        <ManageCategoriesSheet onClose={() => setCategoriesOpen(false)} />
      )}
    </div>
  );
}
