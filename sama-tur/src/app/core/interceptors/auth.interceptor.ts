import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TokenStorage } from '../services/token-storage';

const PREFIXE_API = '/api/';
const ROUTE_CONNEXION = '/api/auth/connexion';

/**
 * Joint le jeton aux appels de notre API et traite la fin de session.
 *
 * - Seuls les chemins relatifs `/api/` reçoivent le Bearer : jamais une autre adresse.
 * - `/api/auth/connexion` est laissée telle quelle. Elle n'a pas de jeton à joindre, et son 401
 *   veut dire « identifiants refusés » (l'écran de connexion l'affiche), pas « session expirée ».
 * - Un 401 sur toute autre route de l'API (jeton expiré, altéré ou absent ; le corps est vide) :
 *   la session est effacée et l'utilisateur renvoyé vers la connexion. L'erreur est relancée à
 *   l'appelant. Pas de boucle : la redirection n'émet aucun appel HTTP.
 * - Un 403 (rôle non autorisé) ne déconnecte pas : la session est valable.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(PREFIXE_API) || req.url.split('?')[0] === ROUTE_CONNEXION) {
    return next(req);
  }

  const token = inject(TokenStorage).getToken();
  const authService = inject(AuthService);
  const router = inject(Router);

  const requete = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requete).pipe(
    catchError((erreur: unknown) => {
      if (erreur instanceof HttpErrorResponse && erreur.status === 401) {
        authService.logout();
        void router.navigate(['/login'], { queryParams: { raison: 'session' } });
      }
      return throwError(() => erreur);
    }),
  );
};
