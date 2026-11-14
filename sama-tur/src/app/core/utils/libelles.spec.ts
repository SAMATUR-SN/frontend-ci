import { PREUVES_NAISSANCE, TYPES_AUDIENCE } from '../models/dossier.model';
import { libelleAudience, libellePreuve, libelleSexe } from './libelles';

describe('libellés', () => {
  it('donnent un libellé français à chaque preuve de naissance', () => {
    expect(PREUVES_NAISSANCE.map(libellePreuve)).toEqual([
      'Certificat d’accouchement',
      'Deux témoins',
    ]);
  });

  it('donnent un libellé français à chaque type d’audience', () => {
    expect(TYPES_AUDIENCE.map(libelleAudience)).toEqual(['Ordinaire', 'Spéciale', 'Foraine']);
  });

  it('écrivent le sexe en toutes lettres', () => {
    expect(libelleSexe('F')).toBe('Féminin');
    expect(libelleSexe('M')).toBe('Masculin');
  });
});
