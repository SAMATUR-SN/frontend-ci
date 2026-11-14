import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { TokenStorage } from '../services/token-storage';
import { uneReponseConnexion } from '../testing/session-test';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controleur: HttpTestingController;
  let stockage: TokenStorage;
  let navigation: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controleur = TestBed.inject(HttpTestingController);
    stockage = TestBed.inject(TokenStorage);
    navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    controleur.verify();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  /** Lance l'appel et rend l'erreur reçue par l'appelant (undefined si l'appel réussit). */
  function appeler(url: string): { erreur?: HttpErrorResponse } {
    const issue: { erreur?: HttpErrorResponse } = {};
    http.get(url).subscribe({ error: (erreur) => (issue.erreur = erreur) });
    return issue;
  }

  describe('en-tête Authorization', () => {
    it('joint le Bearer aux appels de l’API quand un jeton existe', () => {
      stockage.enregistrer(uneReponseConnexion());

      appeler('/api/dossiers');

      const requete = controleur.expectOne('/api/dossiers');
      expect(requete.request.headers.get('Authorization')).toBe('Bearer jeton-de-test');
      requete.flush([]);
    });

    it('n’ajoute aucun en-tête quand il n’y a pas de jeton', () => {
      appeler('/api/dossiers');

      const requete = controleur.expectOne('/api/dossiers');
      expect(requete.request.headers.has('Authorization')).toBe(false);
      requete.flush([]);
    });

    it('n’ajoute pas le jeton à la connexion, même si un jeton est en stock', () => {
      stockage.enregistrer(uneReponseConnexion());

      http.post('/api/auth/connexion', {}).subscribe();

      const requete = controleur.expectOne('/api/auth/connexion');
      expect(requete.request.headers.has('Authorization')).toBe(false);
      requete.flush({});
    });

    it('n’envoie jamais le jeton hors de l’API', () => {
      stockage.enregistrer(uneReponseConnexion());

      appeler('/assets/exemple.json');
      appeler('https://exemple.test/api/dossiers');

      const local = controleur.expectOne('/assets/exemple.json');
      const distant = controleur.expectOne('https://exemple.test/api/dossiers');
      expect(local.request.headers.has('Authorization')).toBe(false);
      expect(distant.request.headers.has('Authorization')).toBe(false);
      local.flush({});
      distant.flush({});
    });
  });

  describe('401 sur une route protégée (corps vide)', () => {
    it('efface la session, renvoie vers /login?raison=session et relance l’erreur', () => {
      stockage.enregistrer(uneReponseConnexion());

      const issue = appeler('/api/dossiers');
      controleur
        .expectOne('/api/dossiers')
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(stockage.getToken()).toBeNull();
      expect(sessionStorage.length).toBe(0);
      expect(navigation).toHaveBeenCalledTimes(1);
      expect(navigation).toHaveBeenCalledWith(['/login'], { queryParams: { raison: 'session' } });
      expect(issue.erreur?.status).toBe(401);
    });

    it('réagit aussi quand aucun jeton n’était envoyé', () => {
      const issue = appeler('/api/alertes');
      controleur.expectOne('/api/alertes').flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(navigation).toHaveBeenCalledWith(['/login'], { queryParams: { raison: 'session' } });
      expect(issue.erreur?.status).toBe(401);
    });

    it('ne provoque aucun appel HTTP supplémentaire (pas de boucle)', () => {
      stockage.enregistrer(uneReponseConnexion());

      appeler('/api/dossiers');
      controleur
        .expectOne('/api/dossiers')
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      controleur.expectNone(() => true);
    });
  });

  describe('401 de la connexion (identifiants refusés)', () => {
    it('ne déconnecte pas et ne redirige pas : l’écran de connexion affiche le refus', () => {
      stockage.enregistrer(uneReponseConnexion());
      let erreur: HttpErrorResponse | undefined;

      http.post('/api/auth/connexion', {}).subscribe({ error: (e) => (erreur = e) });
      controleur
        .expectOne('/api/auth/connexion')
        .flush(
          { detail: 'Identifiant ou mot de passe incorrect.' },
          { status: 401, statusText: 'Unauthorized' },
        );

      expect(stockage.getToken()).toBe('jeton-de-test');
      expect(navigation).not.toHaveBeenCalled();
      expect(erreur?.status).toBe(401);
      expect(erreur?.error.detail).toBe('Identifiant ou mot de passe incorrect.');
    });
  });

  describe('autres erreurs', () => {
    it('un 403 ne déconnecte pas', () => {
      stockage.enregistrer(uneReponseConnexion());

      const issue = appeler('/api/eleves');
      controleur
        .expectOne('/api/eleves')
        .flush(
          { detail: 'Votre rôle ne permet pas cette action.' },
          { status: 403, statusText: 'Forbidden' },
        );

      expect(stockage.getToken()).toBe('jeton-de-test');
      expect(navigation).not.toHaveBeenCalled();
      expect(issue.erreur?.status).toBe(403);
    });

    it('une erreur serveur (500) ne déconnecte pas', () => {
      stockage.enregistrer(uneReponseConnexion());

      const issue = appeler('/api/dossiers');
      controleur
        .expectOne('/api/dossiers')
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(stockage.getToken()).toBe('jeton-de-test');
      expect(navigation).not.toHaveBeenCalled();
      expect(issue.erreur?.status).toBe(500);
    });
  });
});
