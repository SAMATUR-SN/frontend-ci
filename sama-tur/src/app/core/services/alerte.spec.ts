import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DossierResume } from '../models/dossier.model';
import { AlerteService } from './alerte';

const DOSSIER: DossierResume = {
  id: 4,
  reference: 'ST-2026-000004',
  eleve: { prenom: 'Awa', nom: 'Test', classe: 'CM2', ecole: null },
  communeNaissance: 'Bambey',
  etape: 'JUGEMENT_RENDU',
  dateDerniereEtape: '2026-09-20',
  enRetard: true,
  joursDepuisJugement: 55,
};

describe('AlerteService', () => {
  let service: AlerteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AlerteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listerEnRetard', () => {
    it('lit GET /api/alertes sans paramètre et rend des DossierResume', () => {
      let recus: DossierResume[] | undefined;

      service.listerEnRetard().subscribe((d) => (recus = d));
      const requete = http.expectOne((r) => r.url === '/api/alertes');
      expect(requete.request.method).toBe('GET');
      expect(requete.request.params.keys()).toEqual([]);
      requete.flush([DOSSIER]);

      expect(recus).toEqual([DOSSIER]);
    });

    it('envoie la commune choisie', () => {
      service.listerEnRetard(3).subscribe();

      const requete = http.expectOne((r) => r.url === '/api/alertes');
      expect(requete.request.params.get('communeId')).toBe('3');
      requete.flush([]);
    });

    it('n’envoie jamais une commune null ou undefined', () => {
      service.listerEnRetard(null).subscribe();
      service.listerEnRetard(undefined).subscribe();

      for (const requete of http.match((r) => r.url === '/api/alertes')) {
        expect(requete.request.params.has('communeId')).toBe(false);
        requete.flush([]);
      }
    });
  });

  describe('verifier', () => {
    it('envoie POST /api/alertes/verifier et lit la réponse en JSON', () => {
      let recu: unknown;

      service.verifier().subscribe((r) => (recu = r));
      const requete = http.expectOne('/api/alertes/verifier');
      expect(requete.request.method).toBe('POST');
      expect(requete.request.responseType).toBe('json');
      requete.flush({ alertesCreees: 2 });

      expect(recu).toEqual({ alertesCreees: 2 });
    });

    it('relance l’erreur du backend (403 pour un autre rôle que l’état civil)', () => {
      let statut = 0;

      service.verifier().subscribe({ error: (e) => (statut = e.status) });
      http
        .expectOne('/api/alertes/verifier')
        .flush(
          { detail: 'Votre rôle ne permet pas cette action.' },
          { status: 403, statusText: 'Forbidden' },
        );

      expect(statut).toBe(403);
    });
  });

  it('n’expose plus de méthode pour résoudre une alerte', () => {
    expect('resoudre' in service).toBe(false);
    expect('getAll' in service).toBe(false);
  });
});
