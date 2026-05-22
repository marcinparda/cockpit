import { useState } from 'react';
import { X } from 'lucide-react';
import { Habit, PresetHabit } from '../api/schemas';
import { useHabitMutations } from '../api/hooks/useHabitMutations';
import { useCategories } from '../api/hooks/useCategories';
import { usePresets } from '../api/hooks/usePresets';
import { IconPicker } from './IconPicker';

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
  const [activeTab, setActiveTab] = useState<'quick-add' | 'browse'>('quick-add');
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editHabit ? 'Edit habit' : 'Add habit'}
      className="fixed inset-0 z-[60] flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="relative flex h-[85vh] w-full flex-col rounded-t-2xl bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {editHabit ? 'Edit Habit' : 'Add Habit'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Tabs */}
        <div role="tablist" className="flex border-b dark:border-gray-700">
          <button
            role="tab"
            aria-selected={activeTab === 'quick-add'}
            onClick={() => setActiveTab('quick-add')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'quick-add'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Quick Add
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'browse'}
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'browse'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Browse Templates
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === 'quick-add' ? (
            <div className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label htmlFor="habit-name" className="text-sm font-medium">
                  Habit Name
                </label>
                <input
                  id="habit-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  maxLength={100}
                  placeholder="e.g. Morning run"
                  className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1">
                <label htmlFor="habit-type" className="text-sm font-medium">
                  Type
                </label>
                <select
                  id="habit-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      type: e.target.value as Habit['type'] | '',
                    }))
                  }
                  className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                  aria-describedby={errors.type ? 'type-error' : undefined}
                >
                  <option value="">Select type</option>
                  <option value="boolean">Boolean (yes/no)</option>
                  <option value="numeric">Numeric</option>
                  <option value="text">Text</option>
                </select>
                {errors.type && (
                  <p id="type-error" className="text-sm text-red-500">
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
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c}
                      aria-pressed={form.color === c}
                      onClick={() => setForm((p) => ({ ...p, color: c }))}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        form.color === c
                          ? 'scale-110 border-gray-900 dark:border-white'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label htmlFor="habit-category" className="text-sm font-medium">
                  Category
                </label>
                <select
                  id="habit-category"
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category_id: e.target.value }))
                  }
                  className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div className="flex flex-col gap-1">
                <label htmlFor="habit-frequency" className="text-sm font-medium">
                  Frequency
                </label>
                <select
                  id="habit-frequency"
                  value={form.frequency}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, frequency: e.target.value }))
                  }
                  className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Target */}
              {form.type === 'numeric' && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="habit-target" className="text-sm font-medium">
                    Target
                  </label>
                  <input
                    id="habit-target"
                    type="number"
                    value={form.target_value}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, target_value: e.target.value }))
                    }
                    placeholder="e.g. 30"
                    min={0}
                    className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                </div>
              )}

              {/* Streak mode */}
              <div className="flex flex-col gap-1">
                <label htmlFor="habit-streak" className="text-sm font-medium">
                  Streak Mode
                </label>
                <select
                  id="habit-streak"
                  value={form.streak_mode}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      streak_mode: e.target.value as Habit['streak_mode'],
                    }))
                  }
                  className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="none">None</option>
                  <option value="soft">Soft</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="flex flex-col gap-1 rounded-xl border p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <span className="font-medium">{preset.name}</span>
                  <span className="mt-1 self-start rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 capitalize dark:bg-blue-900 dark:text-blue-300">
                      {preset.category_key.replace(/_/g, ' ')}
                    </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'quick-add' && (
          <div className="border-t px-4 py-3 dark:border-gray-700">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createHabit.isPending || updateHabit.isPending}
              className="w-full rounded-xl bg-blue-500 py-3 font-medium text-white hover:bg-blue-600 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              {editHabit ? 'Save Changes' : 'Add Habit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
