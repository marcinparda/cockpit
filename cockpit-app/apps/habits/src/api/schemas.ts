import { z } from 'zod';

export const HabitCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const HabitSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string().default('Star'),
  color: z.string().nullable().optional(),
  type: z.enum(['boolean', 'numeric', 'text']).default('boolean'),
  streak_mode: z.enum(['none', 'soft', 'hard']).default('soft'),
  current_streak: z.number().default(0),
  best_streak: z.number().default(0),
  description: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  category_name: z.string().nullable().optional(),
  frequency: z.string().default('daily'),
  target_value: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  is_archived: z.boolean().default(false),
  sort_order: z.number().default(0),
  today_entry: z
    .object({
      id: z.string().uuid(),
      habit_id: z.string().uuid(),
      logged_at: z.string(),
      boolean_value: z.boolean().nullable().optional(),
      numeric_value: z.number().nullable().optional(),
      numeric_unit: z.string().nullable().optional(),
      text_value: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const HabitEntrySchema = z.object({
  id: z.string().uuid(),
  habit_id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_at: z.string(),
  boolean_value: z.boolean().nullable().optional(),
  numeric_value: z.number().nullable().optional(),
  numeric_unit: z.string().nullable().optional(),
  text_value: z.string().nullable().optional(),
});

export const StreakResponseSchema = z.object({
  current_streak: z.number(),
  best_streak: z.number(),
  last_period_completed: z.boolean(),
});


export const PresetHabitSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string(),
  type: z.string(),
  category_key: z.string(),
  color: z.string().optional().nullable(),
  default_frequency_type: z.string(),
  default_target_value: z.number().optional().nullable(),
  default_target_unit: z.string().optional().nullable(),
  sort_order: z.number(),
});

export const UserHabitSettingsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  push_subscription: z.record(z.string(), z.unknown()).nullable().optional(),
  notifications_enabled: z.boolean(),
});

export type Habit = z.infer<typeof HabitSchema>;
export type HabitType = Habit['type'];
export type StreakMode = Habit['streak_mode'];
export type HabitCategory = z.infer<typeof HabitCategorySchema>;
export type HabitEntry = z.infer<typeof HabitEntrySchema>;
export type StreakResponse = z.infer<typeof StreakResponseSchema>;
export type PresetHabit = z.infer<typeof PresetHabitSchema>;
export type UserHabitSettings = z.infer<typeof UserHabitSettingsSchema>;
