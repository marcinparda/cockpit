import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, tap } from 'rxjs';
import { PermissionService } from './permission.service';
import { AuthService } from './auth.service';

export function permissionGuard(feature: string, action: string): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const authService = inject(AuthService);

    return permissionService.hasPermission(feature, action).pipe(
      tap((hasPermission) => {
        if (!hasPermission) {
          authService.redirectToLogin();
        }
      }),
      map((hasPermission) => hasPermission),
    );
  };
}
