
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorage } from '../services/token-storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorage);
  const token = tokenStorage.getToken();

  // Ne pas modifier la requête si aucun token n'existe.
  if (!token) {
    return next(req);
  }

  // Ajouter le JWT uniquement aux requêtes de notre API.
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
