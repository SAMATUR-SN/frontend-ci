import { ETAPES } from '../models/dossier.model';
import { libelleEtape } from './etapes';

describe('étapes', () => {
  it('sont au nombre de six, dans l’ordre du contrat', () => {
    expect([...ETAPES]).toEqual([
      'DETECTE',
      'CERTIFICAT_OBTENU',
      'DOSSIER_COMPLET',
      'JUGEMENT_RENDU',
      'TRANSCRIT',
      'ACTE_REMIS',
    ]);
  });

  it('ont toutes un libellé français distinct', () => {
    const libelles = ETAPES.map(libelleEtape);

    expect(new Set(libelles).size).toBe(6);
    expect(libelles).toEqual([
      'Détecté',
      'Certificat obtenu',
      'Dossier complet',
      'Jugement rendu',
      'Transcrit',
      'Acte remis',
    ]);
  });
});
