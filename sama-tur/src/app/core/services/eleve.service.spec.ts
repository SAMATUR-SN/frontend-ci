import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RapportImport } from '../models/rapport-import.model';
import { EleveService } from './eleve.service';

describe('EleveService.importerCsv', () => {
  let service: EleveService;
  let http: HttpTestingController;

  const fichier = () => new File(['prenom;nom\r\n'], 'eleves.csv', { type: 'text/csv' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EleveService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envoie un multipart POST /api/eleves/import avec le fichier dans le champ « file »', () => {
    const csv = fichier();

    service.importerCsv(csv).subscribe();

    const requete = http.expectOne('/api/eleves/import');
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body instanceof FormData).toBe(true);
    const corps = requete.request.body as FormData;
    expect([...corps.keys()]).toEqual(['file']);
    expect((corps.get('file') as File).name).toBe('eleves.csv');
    requete.flush({ total: 0, importes: 0, rejetes: 0, erreurs: [] });
  });

  it('ne pose aucun Content-Type : le navigateur ajoute la frontière du multipart', () => {
    service.importerCsv(fichier()).subscribe();

    const requete = http.expectOne('/api/eleves/import');
    expect(requete.request.headers.has('Content-Type')).toBe(false);
    requete.flush({ total: 0, importes: 0, rejetes: 0, erreurs: [] });
  });

  it('lit la réponse en JSON typé, plus en texte', () => {
    const rapport: RapportImport = {
      total: 2,
      importes: 1,
      rejetes: 1,
      erreurs: [{ ligne: 3, motif: 'commune inconnue : Bambeye' }],
    };
    let recu: RapportImport | undefined;

    service.importerCsv(fichier()).subscribe((r) => (recu = r));
    const requete = http.expectOne('/api/eleves/import');
    expect(requete.request.responseType).toBe('json');
    requete.flush(rapport);

    expect(recu).toEqual(rapport);
    expect(typeof recu).toBe('object');
  });

  it('relance l’erreur du backend (422 colonnes manquantes)', () => {
    let statut = 0;

    service.importerCsv(fichier()).subscribe({ error: (e) => (statut = e.status) });
    http
      .expectOne('/api/eleves/import')
      .flush(
        { type: 'https://samatur.sn/erreurs/colonnes-manquantes', detail: 'nom_mere' },
        { status: 422, statusText: 'Unprocessable' },
      );

    expect(statut).toBe(422);
  });
});
