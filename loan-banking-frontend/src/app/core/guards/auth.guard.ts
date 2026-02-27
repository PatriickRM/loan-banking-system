import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';


export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return router.createUrlTree(['/auth/login']);
};

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/auth/login']);
    }

    if (auth.hasAnyRole(...allowedRoles)) return true;

    auth.redirectToDashboard();
    return false;
  };
};


export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (!auth.isAuthenticated()) return true;

  auth.redirectToDashboard();
  return false;
};