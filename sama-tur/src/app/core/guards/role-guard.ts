
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorage } from '../services/token-storage';

export const roleGuard: CanActivateFn = (route) => {
  const tokenStorage = inject(TokenStorage);
  const router = inject(Router);

  const token = tokenStorage.getToken();

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  const rolesAutorises: string[] = route.data['roles'] ?? [];

  if (rolesAutorises.length === 0) {
    return router.createUrlTree(['/dashboard']);
  }

  if (tokenStorage.hasRole(rolesAutorises)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
