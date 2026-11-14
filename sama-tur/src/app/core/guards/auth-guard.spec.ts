import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { TokenStorage } from '../services/token-storage';
import { uneReponseConnexion } from '../testing/session-test';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  const route = {} as ActivatedRouteSnapshot;
  const etat = {} as RouterStateSnapshot;

  let stockage: TokenStorage;
  let router: Router;

  /** Exécute la garde et rend l'adresse de redirection, ou true. */
  function resultat(): true | string {
    const retour = executeGuard(route, etat) as true | UrlTree;
    return retour === true ? true : router.serializeUrl(retour);
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    stockage = TestBed.inject(TokenStorage);
    router = TestBed.inject(Router);
  });

  afterEach(() => sessionStorage.clear());

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('laisse passer une session valable', () => {
    stockage.enregistrer(uneReponseConnexion());

    expect(resultat()).toBe(true);
  });

  it('renvoie vers /login, sans motif, quand il n’y a pas de jeton', () => {
    expect(resultat()).toBe('/login');
  });

  it('renvoie vers /login?raison=session et efface la session quand le jeton est expiré', () => {
    stockage.enregistrer(uneReponseConnexion('ECOLE', -1_000));

    expect(resultat()).toBe('/login?raison=session');
    expect(stockage.getToken()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it('traite un jeton sans date d’expiration comme expiré', () => {
    sessionStorage.setItem('samatur_token', 'jeton-de-test');

    expect(resultat()).toBe('/login?raison=session');
    expect(stockage.getToken()).toBeNull();
  });
});
