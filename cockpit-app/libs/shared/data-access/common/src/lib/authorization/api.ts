import { baseApi } from '../api/baseApi';
import { AUTHORIZATION_ENDPOINTS } from './endpoints';
import { permissionsResponseSchema, rolesResponseSchema } from './schemas';
import type { Permission } from '@cockpit-app/api-types';
import { z } from 'zod';

export async function getCurrentUserPermissions(): Promise<Permission[]> {
  return baseApi.getRequest<Permission[]>(
    AUTHORIZATION_ENDPOINTS.currentUserPermissions(),
    permissionsResponseSchema,
  );
}

export type UserRole = z.infer<typeof rolesResponseSchema>[number];

export async function getCurrentUserRoles(): Promise<UserRole[]> {
  return baseApi.getRequest<UserRole[]>(
    AUTHORIZATION_ENDPOINTS.currentUserRoles(),
    rolesResponseSchema,
  );
}
