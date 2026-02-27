import { Routes } from '@angular/router';
import { authGuard, roleGuard, publicOnlyGuard } from './core/guards/auth.guard';
import { UserRole } from './core/models/auth.models';

export const routes: Routes = [
  // Redirect root
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Auth routes (public only)
  {
    path: 'auth',
    canActivate: [publicOnlyGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent),
      },
      // OAuth2 redirect handler - processes token from Google/GitHub
      {
        path: 'oauth2/redirect',
        loadComponent: () =>
          import('./features/auth/pages/oauth-redirect/oauth-redirect.component').then(m => m.OAuthRedirectComponent),
      },
    ],
  },

  // Dashboard routes (authenticated)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'analista',
        canActivate: [roleGuard(['ANALISTA', 'ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/analista/analista-dashboard.component').then(m => m.AnalistaDashboardComponent),
      },
      {
        path: 'cliente',
        canActivate: [roleGuard(['CLIENTE'])],
        loadComponent: () =>
          import('./features/dashboard/cliente/cliente-dashboard.component').then(m => m.ClienteDashboardComponent),
      },
    ],
  },

  // Evaluations (ANALISTA / ADMIN)
  {
    path: 'evaluations',
    canActivate: [authGuard, roleGuard(['ANALISTA', 'ADMIN'])],
    loadComponent: () =>
      import('./features/evaluation/evaluations-page.component').then(m => m.EvaluationsPageComponent),
  },

  // Loans management (ANALISTA / ADMIN)
  {
    path: 'loans',
    canActivate: [authGuard, roleGuard(['ANALISTA', 'ADMIN', 'CLIENTE'])],
    loadComponent: () =>
      import('./features/loan/loans-page.component').then(m => m.LoansPageComponent),
  },

  // Payments (CLIENTE)
  {
    path: 'payments',
    canActivate: [authGuard, roleGuard(['CLIENTE'])],
    loadComponent: () =>
      import('./features/payment/payment-page.component').then(m => m.PaymentPageComponent),
  },

  // Customer profile
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/customer-profile.component').then(m => m.CustomerProfileComponent),
  },

  // Wildcard
  { path: '**', redirectTo: '/auth/login' },
];