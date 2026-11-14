import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { Role } from '../models/utilisateur.model';
import { TokenStorage } from '../services/token-storage';
import { uneReponseConnexion } from '../testing/session-test';
import { roleGuard } from './role-guard';

describe('roleGuard', () => {
  const etat = {} as RouterStateSnapshot;

  let stockage: TokenStorage;
  let router: Router;

  /** Exécute la garde pour une route qui n'autorise que `roles`. */
  function resultat(roles?: Role[]): true | string {
    const route = { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
    const retour = TestBed.runInInjectionContext(() => roleGuard(route, etat)) as true | UrlTree;
    return retour === true ? true : router.serializeUrl(retour);
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    stockage = TestBed.inject(TokenStorage);
    router = TestBed.inject(Router);
  });

  afterEach(() => sessionStorage.clear());

  it('laisse passer un rôle autorisé', () => {
    stockage.enregistrer(uneReponseConnexion('ECOLE'));

    expect(resultat(['ECOLE'])).toBe(true);
  });

  it('laisse passer quand le rôle figure parmi plusieurs autorisés', () => {
    stockage.enregistrer(uneReponseConnexion('TRIBUNAL'));

    expect(resultat(['ETAT_CIVIL', 'TRIBUNAL', 'SUPERVISEUR'])).toBe(true);
  });

  it('renvoie vers /dashboard quand le rôle n’est pas autorisé', () => {
    stockage.enregistrer(uneReponseConnexion('SUPERVISEUR'));

    expect(resultat(['ECOLE'])).toBe('/dashboard');
  });

  it('renvoie vers /dashboard quand la route ne déclare aucun rôle', () => {
    stockage.enregistrer(uneReponseConnexion('ECOLE'));

    expect(resultat()).toBe('/dashboard');
  });

  it('refuse un utilisateur dont le rôle stocké est inconnu', () => {
    stockage.enregistrer(uneReponseConnexion('ECOLE'));
    sessionStorage.setItem(
      'samatur_user',
      JSON.stringify({ identifiant: 'x', nomAffiche: 'x', role: 'INCONNU', structure: null }),
    );

    expect(resultat(['ECOLE'])).toBe('/dashboard');
  });

  it('renvoie vers /login quand il n’y a pas de session', () => {
    expect(resultat(['ECOLE'])).toBe('/login');
  });

  it('renvoie vers /login?raison=session quand le jeton est expiré', () => {
    stockage.enregistrer(uneReponseConnexion('ECOLE', -1_000));

    expect(resultat(['ECOLE'])).toBe('/login?raison=session');
    expect(stockage.getToken()).toBeNull();
  });
});
