import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { uneReponseConnexion } from '../testing/session-test';
import { TokenStorage } from './token-storage';

describe('TokenStorage', () => {
  let service: TokenStorage;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('enregistrer et relire', () => {
    it('conserve le jeton, l’expiration et l’utilisateur', () => {
      const reponse = uneReponseConnexion('ETAT_CIVIL');

      service.enregistrer(reponse);

      expect(service.getToken()).toBe('jeton-de-test');
      expect(service.getUtilisateur()).toEqual(reponse.utilisateur);
      expect(service.getRole()).toBe('ETAT_CIVIL');
      expect(sessionStorage.getItem('samatur_expire')).toBe(reponse.expireA);
    });

    it('écrit dans le sessionStorage et jamais dans le localStorage', () => {
      service.enregistrer(uneReponseConnexion());

      expect(sessionStorage.getItem('samatur_token')).toBe('jeton-de-test');
      expect(sessionStorage.getItem('samatur_user')).not.toBeNull();
      expect(localStorage.length).toBe(0);
    });

    it('conserve un utilisateur sans structure (superviseur)', () => {
      service.enregistrer(uneReponseConnexion('SUPERVISEUR'));

      expect(service.getUtilisateur()?.structure).toBeNull();
      expect(service.getRole()).toBe('SUPERVISEUR');
    });

    it('ne renvoie rien quand aucune session n’a été enregistrée', () => {
      expect(service.getToken()).toBeNull();
      expect(service.getUtilisateur()).toBeNull();
      expect(service.getRole()).toBeNull();
    });
  });

  describe('isExpired', () => {
    it('est faux pour une session encore valable', () => {
      service.enregistrer(uneReponseConnexion('ECOLE', 60_000));

      expect(service.isExpired()).toBe(false);
    });

    it('est vrai pour une session échue', () => {
      service.enregistrer(uneReponseConnexion('ECOLE', -1_000));

      expect(service.isExpired()).toBe(true);
    });

    it('est vrai quand la date d’expiration est absente', () => {
      expect(service.isExpired()).toBe(true);
    });

    it('est vrai quand la date d’expiration est illisible', () => {
      service.enregistrer(uneReponseConnexion());
      sessionStorage.setItem('samatur_expire', 'pas-une-date');

      expect(service.isExpired()).toBe(true);
    });
  });

  describe('clear', () => {
    it('efface le jeton, l’expiration et l’utilisateur', () => {
      service.enregistrer(uneReponseConnexion());

      service.clear();

      expect(service.getToken()).toBeNull();
      expect(service.getUtilisateur()).toBeNull();
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('valeurs altérées dans le stockage', () => {
    it('ignore un utilisateur dont le JSON est corrompu', () => {
      sessionStorage.setItem('samatur_user', '{pas du json');

      expect(service.getUtilisateur()).toBeNull();
      expect(service.getRole()).toBeNull();
    });

    it('ignore un utilisateur dont le rôle est inconnu', () => {
      sessionStorage.setItem(
        'samatur_user',
        JSON.stringify({ identifiant: 'x', nomAffiche: 'x', role: 'INCONNU', structure: null }),
      );

      expect(service.getUtilisateur()).toBeNull();
    });

    it('ignore un utilisateur qui n’a pas la forme attendue', () => {
      sessionStorage.setItem('samatur_user', JSON.stringify(['ECOLE']));

      expect(service.getUtilisateur()).toBeNull();
    });
  });

  describe('stockage indisponible', () => {
    it('n’échoue pas quand l’écriture est refusée, et ne laisse pas de session partielle', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota dépassé', 'QuotaExceededError');
      });

      expect(() => service.enregistrer(uneReponseConnexion())).not.toThrow();
      expect(service.getToken()).toBeNull();
    });

    it('n’échoue pas quand la lecture est refusée', () => {
      service.enregistrer(uneReponseConnexion());
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('accès refusé', 'SecurityError');
      });

      expect(service.getToken()).toBeNull();
      expect(service.getUtilisateur()).toBeNull();
      expect(service.isExpired()).toBe(true);
    });

    it('n’échoue pas quand l’effacement est refusé', () => {
      service.enregistrer(uneReponseConnexion());
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new DOMException('accès refusé', 'SecurityError');
      });

      expect(() => service.clear()).not.toThrow();
    });
  });

  describe('côté serveur (SSR)', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      service = TestBed.inject(TokenStorage);
    });

    it('ne touche jamais au stockage et ne renvoie aucune session', () => {
      const ecriture = vi.spyOn(Storage.prototype, 'setItem');
      const lecture = vi.spyOn(Storage.prototype, 'getItem');

      service.enregistrer(uneReponseConnexion());

      expect(service.getToken()).toBeNull();
      expect(service.getRole()).toBeNull();
      expect(service.isExpired()).toBe(true);
      expect(() => service.clear()).not.toThrow();
      expect(ecriture).not.toHaveBeenCalled();
      expect(lecture).not.toHaveBeenCalled();
    });
  });
});
