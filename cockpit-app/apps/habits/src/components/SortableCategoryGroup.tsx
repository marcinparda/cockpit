import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Habit } from '../api/schemas';
import { SortableHabitRow } from './SortableHabitRow';

interface SortableCategoryGroupProps {
  categoryName: string;
  habits: Habit[];
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  onReorder: (id: string, newSortOrder: number) => void;
}

export function SortableCategoryGroup({
  categoryName,
  habits,
  onEdit,
  onArchive,
  onReorder,
}: SortableCategoryGroupProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = habits.findIndex((h) => h.id === active.id);
    const newIndex = habits.findIndex((h) => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Re-compute sort_order for affected items
    const reordered = [...habits];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // PATCH each item individually with its new index as sort_order
    reordered.forEach((habit, index) => {
      if (habit.sort_order !== index) {
        onReorder(habit.id, index);
      }
    });
  }

  return (
    <section aria-label={categoryName}>
      <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {categoryName}
      </h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={habits.map((h) => h.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {habits.map((habit) => (
              <SortableHabitRow
                key={habit.id}
                habit={habit}
                onEdit={onEdit}
                onArchive={onArchive}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
