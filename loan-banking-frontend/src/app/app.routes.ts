import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [publicOnlyGuard],
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      {
        path: 'register',
        canActivate: [publicOnlyGuard],
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then(
            (m) => m.RegisterComponent
          ),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/admin/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'analista',
        canActivate: [roleGuard(['ANALISTA', 'ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/analista/analista-dashboard.component').then(
            (m) => m.AnalistaDashboardComponent
          ),
      },
      {
        path: 'cliente',
        canActivate: [roleGuard(['CLIENTE'])],
        loadComponent: () =>
          import('./features/dashboard/cliente/cliente-dashboard.component').then(
            (m) => m.ClienteDashboardComponent
          ),
      },
      {
        path: '',
        redirectTo: 'cliente',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];