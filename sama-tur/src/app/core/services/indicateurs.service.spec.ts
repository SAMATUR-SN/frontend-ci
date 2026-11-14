import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Indicateurs } from '../models/indicateurs.model';
import { IndicateursService } from './indicateurs.service';

const REPONSE: Indicateurs = {
  communeId: null,
  dateReference: '2026-11-14',
  delaiCibleJours: 15,
  i1PartTranscritsDansDelaiCible: 0.5454545454545454,
  i2DelaiMedianJours: 75,
  i3ElevesClasseExamenSansActe: 26,
  dossiersParEtape: {
    DETECTE: 7,
    CERTIFICAT_OBTENU: 7,
    DOSSIER_COMPLET: 6,
    JUGEMENT_RENDU: 9,
    TRANSCRIT: 6,
    ACTE_REMIS: 5,
  },
  dossiersEnRetard: 5,
  totalDossiers: 40,
};

describe('IndicateursService', () => {
  let service: IndicateursService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IndicateursService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function appeler(
    lancer: () => ReturnType<IndicateursService['obtenir']>,
  ): Record<string, string> {
    let recu: Indicateurs | undefined;
    lancer().subscribe((i) => (recu = i));
    const requete = http.expectOne((r) => r.url === '/api/indicateurs');
    expect(requete.request.method).toBe('GET');
    const envoyes: Record<string, string> = {};
    for (const cle of requete.request.params.keys()) {
      envoyes[cle] = requete.request.params.get(cle) as string;
    }
    requete.flush(REPONSE);
    expect(recu).toEqual(REPONSE);
    return envoyes;
  }

  it('lit GET /api/indicateurs sans aucun paramètre par défaut', () => {
    expect(appeler(() => service.obtenir())).toEqual({});
  });

  it('envoie la commune de naissance choisie', () => {
    expect(appeler(() => service.obtenir(3))).toEqual({ communeId: '3' });
  });

  it('envoie la date de référence', () => {
    expect(appeler(() => service.obtenir(undefined, '2026-11-01'))).toEqual({
      dateReference: '2026-11-01',
    });
  });

  it('envoie les deux filtres ensemble', () => {
    expect(appeler(() => service.obtenir(3, '2026-11-01'))).toEqual({
      communeId: '3',
      dateReference: '2026-11-01',
    });
  });

  it('n’envoie jamais un filtre null, undefined ou vide', () => {
    const envoyes = appeler(() => service.obtenir(null, ''));

    expect(envoyes).toEqual({});
    expect(Object.values(envoyes)).not.toContain('null');
    expect(Object.values(envoyes)).not.toContain('undefined');
  });

  it('envoie une commune dont l’identifiant est 0, qui reste une vraie valeur', () => {
    expect(appeler(() => service.obtenir(0))).toEqual({ communeId: '0' });
  });

  it('rend des indicateurs sans donnée tels quels (null)', () => {
    let recu: Indicateurs | undefined;

    service.obtenir(9).subscribe((i) => (recu = i));
    http
      .expectOne((r) => r.url === '/api/indicateurs')
      .flush({
        ...REPONSE,
        communeId: 9,
        i1PartTranscritsDansDelaiCible: null,
        i2DelaiMedianJours: null,
        i3ElevesClasseExamenSansActe: 0,
      });

    expect(recu?.i1PartTranscritsDansDelaiCible).toBeNull();
    expect(recu?.i2DelaiMedianJours).toBeNull();
    expect(recu?.i3ElevesClasseExamenSansActe).toBe(0);
  });
});
