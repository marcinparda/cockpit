import { z } from 'zod';

export const roleSchema = z.object({
  name: z.string(),
  id: z.string(),
  description: z.string().nullable().optional(),
});

export const rolesResponseSchema = z.array(roleSchema);

export const actionSchema = z.object({
  name: z.string(),
  id: z.string(),
});

export const featureSchema = z.object({
  name: z.string(),
  id: z.string(),
});

export const permissionSchema = z.object({
  feature_id: z.string(),
  action_id: z.string(),
  id: z.string(),
  feature: featureSchema.nullable().optional(),
  action: actionSchema.nullable().optional(),
});

export const permissionsResponseSchema = z.array(permissionSchema);
