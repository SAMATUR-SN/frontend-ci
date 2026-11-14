import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { uneReponseConnexion } from '../testing/session-test';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let stockage: TokenStorage;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    stockage = TestBed.inject(TokenStorage);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('envoie identifiant et motDePasse à /api/auth/connexion', () => {
    service.login({ identifiant: 'test@samatur.sn', motDePasse: 'secret-de-test' }).subscribe();

    const requete = http.expectOne('/api/auth/connexion');
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual({
      identifiant: 'test@samatur.sn',
      motDePasse: 'secret-de-test',
    });
    requete.flush(uneReponseConnexion());
  });

  it('enregistre le jeton, l’expiration et l’utilisateur de la réponse', () => {
    const reponse = uneReponseConnexion('TRIBUNAL');
    let recue: unknown;

    service
      .login({ identifiant: 'test@samatur.sn', motDePasse: 'x' })
      .subscribe((r) => (recue = r));
    http.expectOne('/api/auth/connexion').flush(reponse);

    expect(recue).toEqual(reponse);
    expect(service.getToken()).toBe('jeton-de-test');
    expect(stockage.getRole()).toBe('TRIBUNAL');
    expect(stockage.getUtilisateur()).toEqual(reponse.utilisateur);
    expect(stockage.isExpired()).toBe(false);
  });

  it('ne conserve rien quand la connexion est refusée (401)', () => {
    let statut = 0;

    service.login({ identifiant: 'test@samatur.sn', motDePasse: 'faux' }).subscribe({
      error: (erreur) => (statut = erreur.status),
    });
    http
      .expectOne('/api/auth/connexion')
      .flush({ detail: 'Identifiant ou mot de passe incorrect.' }, { status: 401, statusText: '' });

    expect(statut).toBe(401);
    expect(service.getToken()).toBeNull();
    expect(stockage.getUtilisateur()).toBeNull();
  });

  it('logout efface toute la session', () => {
    stockage.enregistrer(uneReponseConnexion());

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(stockage.getUtilisateur()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
});
