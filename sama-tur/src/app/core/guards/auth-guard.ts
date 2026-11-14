import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { TokenStorage } from '../services/token-storage';

/**
 * Une session est utilisable quand un jeton est présent et que sa date d'expiration n'est pas
 * atteinte. Sinon, on efface ce qui reste du stockage et on renvoie vers la connexion.
 *
 * Seul un jeton qui existait mais n'est plus valable ajoute `?raison=session` : l'écran de
 * connexion explique alors que la session a expiré. Sans jeton (première visite, déconnexion
 * volontaire), il n'y a rien à expliquer.
 */
export function verifierSession(tokenStorage: TokenStorage, router: Router): true | UrlTree {
  const token = tokenStorage.getToken();

  if (token && !tokenStorage.isExpired()) {
    return true;
  }

  tokenStorage.clear();

  return router.createUrlTree(['/login'], token ? { queryParams: { raison: 'session' } } : {});
}

export const authGuard: CanActivateFn = () => verifierSession(inject(TokenStorage), inject(Router));
