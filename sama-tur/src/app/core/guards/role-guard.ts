import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/utilisateur.model';
import { TokenStorage } from '../services/token-storage';
import { verifierSession } from './auth-guard';

/**
 * Laisse passer si le rôle de l'utilisateur figure dans `data.roles` de la route, sinon renvoie
 * vers le tableau de bord. L'interface restreint ; la sécurité réelle est celle du backend (403).
 */
export const roleGuard: CanActivateFn = (route) => {
  const tokenStorage = inject(TokenStorage);
  const router = inject(Router);

  const session = verifierSession(tokenStorage, router);

  if (session !== true) {
    return session;
  }

  const rolesAutorises: Role[] = route.data['roles'] ?? [];
  const role = tokenStorage.getRole();

  if (role !== null && rolesAutorises.includes(role)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
