import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorage } from '../services/token-storage';

export const authGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorage);
  const router = inject(Router);

  const token = tokenStorage.getToken();

  if (token) {
    return true;
  }

  return router.createUrlTree(['/login']);
};