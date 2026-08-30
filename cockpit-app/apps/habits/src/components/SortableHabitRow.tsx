import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Archive, Pencil, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Habit } from '../api/schemas';
import { HABIT_ICONS } from '../icons/index';
import { truncateName } from '../utils/text';

interface SortableHabitRowProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
}

export function SortableHabitRow({ habit, onEdit, onArchive }: SortableHabitRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = HABIT_ICONS[habit.icon] ?? HABIT_ICONS['Star'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Drag handle */}
      <button
        type="button"
        data-testid="drag-handle"
        className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} aria-hidden="true" />
      </button>

      {/* Icon */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: habit.color ?? '#3b82f6' }}
        aria-hidden="true"
      >
        <Icon size={16} className="text-white" />
      </div>

      {/* Name + category — tap to view stats */}
      <button
        type="button"
        onClick={() => void navigate(`/habits/${habit.id}`)}
        className="flex min-w-0 flex-1 flex-col text-left hover:underline"
        aria-label={`View stats for ${habit.name}`}
      >
        <span className="truncate font-medium" title={habit.name}>
          {truncateName(habit.name)}
        </span>
        {habit.category_name && (
          <span className="text-xs text-gray-500">{habit.category_name}</span>
        )}
      </button>

      {/* Category badge */}
      {habit.category_name && (
        <span className="hidden shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300 sm:inline">
          {habit.category_name}
        </span>
      )}

      {/* Action menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Actions"
          aria-expanded={menuOpen}
          className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <MoreVertical size={18} aria-hidden="true" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-8 z-10 w-36 rounded-xl border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(habit);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Pencil size={14} aria-hidden="true" />
              Edit
            </button>
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onArchive(habit);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Archive size={14} aria-hidden="true" />
              {habit.is_archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
