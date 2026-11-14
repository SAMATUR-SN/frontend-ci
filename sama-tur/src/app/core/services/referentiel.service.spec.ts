import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ReferentielService } from './referentiel.service';

describe('ReferentielService', () => {
  let service: ReferentielService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReferentielService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('demande les communes à /api/referentiels/communes', () => {
    let recues: unknown;

    service.communes().subscribe((c) => (recues = c));
    const requete = http.expectOne('/api/referentiels/communes');
    expect(requete.request.method).toBe('GET');
    requete.flush([{ id: 1, nom: 'Bambey' }]);

    expect(recues).toEqual([{ id: 1, nom: 'Bambey' }]);
  });

  it('demande les écoles à /api/referentiels/ecoles', () => {
    let recues: unknown;

    service.ecoles().subscribe((e) => (recues = e));
    http
      .expectOne('/api/referentiels/ecoles')
      .flush([{ id: 2, code: 'ECO-BAM-01', nom: 'École test', communeId: 1 }]);

    expect(recues).toEqual([{ id: 2, code: 'ECO-BAM-01', nom: 'École test', communeId: 1 }]);
  });

  it('ne rappelle pas le backend : la liste est mémorisée pour la session', () => {
    service.communes().subscribe();
    http.expectOne('/api/referentiels/communes').flush([{ id: 1, nom: 'Bambey' }]);

    let secondeLecture: unknown;
    service.communes().subscribe((c) => (secondeLecture = c));

    http.expectNone('/api/referentiels/communes');
    expect(secondeLecture).toEqual([{ id: 1, nom: 'Bambey' }]);
  });

  it('partage un appel en cours entre deux abonnés', () => {
    service.ecoles().subscribe();
    service.ecoles().subscribe();

    http.expectOne('/api/referentiels/ecoles').flush([]);
  });

  it('ne mémorise pas une erreur : l’abonné suivant relance l’appel', () => {
    let statut = 0;
    service.communes().subscribe({ error: (e) => (statut = e.status) });
    http.expectOne('/api/referentiels/communes').flush(null, { status: 500, statusText: 'Erreur' });
    expect(statut).toBe(500);

    let recues: unknown;
    service.communes().subscribe((c) => (recues = c));
    http.expectOne('/api/referentiels/communes').flush([{ id: 1, nom: 'Bambey' }]);

    expect(recues).toEqual([{ id: 1, nom: 'Bambey' }]);
  });
});
