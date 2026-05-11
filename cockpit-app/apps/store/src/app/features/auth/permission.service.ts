import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, shareReplay } from 'rxjs';
import { environments } from '@cockpit-app/shared-utils';

interface Permission {
  id: string;
  feature_id: string;
  action_id: string;
  feature?: { name: string; id: string } | null;
  action?: { name: string; id: string } | null;
}

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private permissions$: Observable<Permission[]> | null = null;

  constructor(private http: HttpClient) {}

  getPermissions(): Observable<Permission[]> {
    if (!this.permissions$) {
      this.permissions$ = this.http
        .get<Permission[]>(
          `${environments.apiUrl}/api/v1/authorization/user-permissions/me`,
          { withCredentials: true },
        )
        .pipe(
          catchError(() => of([])),
          shareReplay(1),
        );
    }
    return this.permissions$;
  }

  hasPermission(feature: string, action: string): Observable<boolean> {
    return this.getPermissions().pipe(
      map((permissions) =>
        permissions.some(
          (p) => p.feature?.name === feature && p.action?.name === action,
        ),
      ),
    );
  }
}
