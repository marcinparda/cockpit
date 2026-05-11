import { Routes } from '@angular/router';
import { authGuard } from './features/auth/auth.guard';
import { permissionGuard } from './features/auth/permission.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard, permissionGuard('redis_store', 'read')],
    loadChildren: () =>
      import('./features/store/store.routes').then((m) => m.STORE_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
