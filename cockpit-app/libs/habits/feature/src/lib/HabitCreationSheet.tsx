import { useState } from 'react';
import {
  Habit,
  PresetHabit,
  useCategories,
  useHabitMutations,
  usePresets,
} from '@cockpit-app/habits-data-access';
import {
  ColorSwatchPicker,
  HABIT_COLORS,
  IconPicker,
  TabBar,
} from '@cockpit-app/habits-ui';
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@cockpit-app/shared-react-ui';

type CreationTab = 'quick-add' | 'browse';

const TABS: readonly { id: CreationTab; label: string }[] = [
  { id: 'quick-add', label: 'Quick Add' },
  { id: 'browse', label: 'Browse Templates' },
];

/** Radix Select reserves '' for "no value", so "No category" needs its own key. */
const NO_CATEGORY = '__none__';

interface HabitCreationSheetProps {
  onClose: () => void;
  editHabit?: Habit;
}

interface FormState {
  name: string;
  type: Habit['type'] | '';
  icon: string;
  color: string;
  category_id: string;
  frequency: string;
  target_value: string;
  streak_mode: Habit['streak_mode'];
}

interface FormErrors {
  name?: string;
  type?: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  type: '',
  icon: 'Star',
  color: '#3b82f6',
  category_id: '',
  frequency: 'daily',
  target_value: '',
  streak_mode: 'soft',
};

function formFromHabit(habit: Habit): FormState {
  return {
    name: habit.name,
    type: habit.type,
    icon: habit.icon,
    color: habit.color ?? '#3b82f6',
    category_id: habit.category_id ?? '',
    frequency: habit.frequency,
    target_value: habit.target_value?.toString() ?? '',
    streak_mode: habit.streak_mode,
  };
}

export function HabitCreationSheet({ onClose, editHabit }: HabitCreationSheetProps) {
  const [activeTab, setActiveTab] = useState<CreationTab>('quick-add');
  const [form, setForm] = useState<FormState>(
    editHabit ? formFromHabit(editHabit) : DEFAULT_FORM,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const { createHabit, updateHabit } = useHabitMutations();
  const { data: categories = [] } = useCategories();
  const { data: presets = [] } = usePresets();

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.type) next.type = 'Type is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      type: form.type as Habit['type'],
      icon: form.icon,
      color: form.color,
      category_id: form.category_id || null,
      frequency: form.frequency,
      target_value: form.target_value ? parseFloat(form.target_value) : undefined,
      streak_mode: form.streak_mode,
    };

    if (editHabit) {
      updateHabit.mutate({ id: editHabit.id, ...payload }, { onSuccess: onClose });
    } else {
      createHabit.mutate(payload, { onSuccess: onClose });
    }
  }

  function handlePresetClick(preset: PresetHabit) {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      frequency: preset.default_frequency_type,
      target_value: preset.default_target_value?.toString() ?? '',
    }));
    setActiveTab('quick-add');
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        aria-label={editHabit ? 'Edit habit' : 'Add habit'}
        className="h-[85vh] gap-0"
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>{editHabit ? 'Edit Habit' : 'Add Habit'}</SheetTitle>
        </SheetHeader>

        <TabBar tabs={TABS} value={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === 'quick-add' ? (
            <div className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="habit-name">Habit Name</Label>
                <Input
                  id="habit-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  maxLength={100}
                  placeholder="e.g. Morning run"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="habit-type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((p) => ({ ...p, type: value as Habit['type'] }))
                  }
                >
                  <SelectTrigger
                    id="habit-type"
                    aria-invalid={errors.type ? true : undefined}
                    aria-describedby={errors.type ? 'type-error' : undefined}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boolean">Boolean (yes/no)</SelectItem>
                    <SelectItem value="numeric">Numeric</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p id="type-error" className="text-sm text-destructive">
                    {errors.type}
                  </p>
                )}
              </div>

              {/* Icon */}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Icon</span>
                <IconPicker
                  selected={form.icon}
                  onSelect={(key) => setForm((p) => ({ ...p, icon: key }))}
                />
              </div>

              {/* Color */}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Color</span>
                <ColorSwatchPicker
                  colors={HABIT_COLORS}
                  value={form.color}
                  onChange={(c) => setForm((p) => ({ ...p, color: c }))}
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="habit-category">Category</Label>
                <Select
                  value={form.category_id || NO_CATEGORY}
                  onValueChange={(value) =>
                    setForm((p) => ({
                      ...p,
                      category_id: value === NO_CATEGORY ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger id="habit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Frequency */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="habit-frequency">Frequency</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(value) =>
                    setForm((p) => ({ ...p, frequency: value }))
                  }
                >
                  <SelectTrigger id="habit-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target */}
              {form.type === 'numeric' && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="habit-target">Target</Label>
                  <Input
                    id="habit-target"
                    type="number"
                    value={form.target_value}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, target_value: e.target.value }))
                    }
                    placeholder="e.g. 30"
                    min={0}
                  />
                </div>
              )}

              {/* Streak mode */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="habit-streak">Streak Mode</Label>
                <Select
                  value={form.streak_mode}
                  onValueChange={(value) =>
                    setForm((p) => ({
                      ...p,
                      streak_mode: value as Habit['streak_mode'],
                    }))
                  }
                >
                  <SelectTrigger id="habit-streak">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="outline"
                  onClick={() => handlePresetClick(preset)}
                  className="h-auto flex-col items-start gap-1 whitespace-normal rounded-xl p-3 text-left"
                >
                  <span className="font-medium">{preset.name}</span>
                  <Badge variant="secondary" className="mt-1 rounded-full capitalize">
                    {preset.category_key.replace(/_/g, ' ')}
                  </Badge>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'quick-add' && (
          <SheetFooter className="border-t px-4 py-3">
            <Button
              type="button"
              size="lg"
              onClick={handleSubmit}
              disabled={createHabit.isPending || updateHabit.isPending}
            >
              {editHabit ? 'Save Changes' : 'Add Habit'}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
