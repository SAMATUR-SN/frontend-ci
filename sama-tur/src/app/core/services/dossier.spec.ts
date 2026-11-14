import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Page } from '../models/page.model';
import { DossierResume } from '../models/dossier.model';
import { DossierService } from './dossier';

describe('DossierService', () => {
  let service: DossierService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DossierService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('lister', () => {
    /** Lance l'appel, rend les paramètres envoyés et répond par `reponse`. */
    function appeler(
      lancer: () => ReturnType<DossierService['lister']>,
      reponse?: Page<DossierResume>,
    ): Record<string, string> {
      lancer().subscribe();
      const requete = http.expectOne((r) => r.url === '/api/dossiers');
      expect(requete.request.method).toBe('GET');
      const envoyes: Record<string, string> = {};
      for (const cle of requete.request.params.keys()) {
        envoyes[cle] = requete.request.params.get(cle) as string;
      }
      requete.flush(
        reponse ?? { contenu: [], page: 0, taille: 20, totalElements: 0, totalPages: 0 },
      );
      return envoyes;
    }

    it('interroge /api/dossiers avec la page 0 et la taille 20 par défaut, rien d’autre', () => {
      expect(appeler(() => service.lister())).toEqual({ page: '0', taille: '20' });
    });

    it('envoie tous les filtres renseignés', () => {
      const envoyes = appeler(() =>
        service.lister(
          {
            etape: 'JUGEMENT_RENDU',
            communeId: 3,
            ecoleId: 7,
            classe: 'CM2',
            enRetard: true,
            q: 'awa',
          },
          2,
          50,
          'reference,asc',
        ),
      );

      expect(envoyes).toEqual({
        page: '2',
        taille: '50',
        etape: 'JUGEMENT_RENDU',
        communeId: '3',
        ecoleId: '7',
        classe: 'CM2',
        enRetard: 'true',
        q: 'awa',
        tri: 'reference,asc',
      });
    });

    it('envoie enRetard=false : « pas en retard » est une vraie valeur', () => {
      expect(appeler(() => service.lister({ enRetard: false }))['enRetard']).toBe('false');
    });

    it('n’envoie jamais un filtre absent, undefined ou vide', () => {
      const envoyes = appeler(() =>
        service.lister({
          etape: undefined,
          communeId: undefined,
          ecoleId: undefined,
          classe: undefined,
          enRetard: undefined,
          q: '',
        }),
      );

      expect(Object.keys(envoyes).sort()).toEqual(['page', 'taille']);
      expect(Object.values(envoyes)).not.toContain('undefined');
      expect(Object.values(envoyes)).not.toContain('null');
    });

    it('retire les espaces de la recherche et n’envoie pas une recherche blanche', () => {
      expect(appeler(() => service.lister({ q: '  awa diop  ' }))['q']).toBe('awa diop');
      expect(appeler(() => service.lister({ q: '   ' }))).not.toHaveProperty('q');
    });

    it('renvoie la page reçue', () => {
      const reponse: Page<DossierResume> = {
        contenu: [
          {
            id: 1,
            reference: 'ST-2026-000001',
            eleve: { prenom: 'Awa', nom: 'Test', classe: 'CM2', ecole: null },
            communeNaissance: null,
            etape: 'DETECTE',
            dateDerniereEtape: null,
            enRetard: false,
            joursDepuisJugement: null,
          },
        ],
        page: 0,
        taille: 20,
        totalElements: 1,
        totalPages: 1,
      };
      let recue: Page<DossierResume> | undefined;

      service.lister().subscribe((p) => (recue = p));
      http.expectOne((r) => r.url === '/api/dossiers').flush(reponse);

      expect(recue).toEqual(reponse);
    });
  });
});
