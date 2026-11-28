import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Archive, Pencil, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button } from '@cockpit-app/shared-react-ui';
import { HABIT_ICONS } from './icons';
import { truncateName } from './utils/text';

/** Fields a sortable habit row reads; any richer habit object satisfies it. */
export interface SortableHabit {
  id: string;
  name: string;
  icon: string;
  color?: string | null;
  category_name?: string | null;
  is_archived: boolean;
  sort_order: number;
}

interface SortableHabitRowProps<T extends SortableHabit> {
  habit: T;
  onEdit: (habit: T) => void;
  onArchive: (habit: T) => void;
}

export function SortableHabitRow<T extends SortableHabit>({
  habit,
  onEdit,
  onArchive,
}: SortableHabitRowProps<T>) {
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
      className="flex items-center gap-3 rounded-xl border bg-card px-3 py-3 text-card-foreground"
    >
      {/* Drag handle */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        data-testid="drag-handle"
        className="size-7 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} aria-hidden="true" />
      </Button>

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
          <span className="text-xs text-muted-foreground">{habit.category_name}</span>
        )}
      </button>

      {/* Category badge */}
      {habit.category_name && (
        <Badge variant="secondary" className="hidden rounded-full sm:inline-flex">
          {habit.category_name}
        </Badge>
      )}

      {/* Action menu */}
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Actions"
          aria-expanded={menuOpen}
          className="size-8 rounded-full"
        >
          <MoreVertical size={18} aria-hidden="true" />
        </Button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-9 z-10 flex w-36 flex-col rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            <Button
              role="menuitem"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setMenuOpen(false);
                onEdit(habit);
              }}
              className="justify-start"
            >
              <Pencil size={14} aria-hidden="true" />
              Edit
            </Button>
            <Button
              role="menuitem"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setMenuOpen(false);
                onArchive(habit);
              }}
              className="justify-start"
            >
              <Archive size={14} aria-hidden="true" />
              {habit.is_archived ? 'Unarchive' : 'Archive'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
