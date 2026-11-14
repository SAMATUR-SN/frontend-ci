import { ETAPES } from '../models/dossier.model';
import { ROLES } from '../models/utilisateur.model';
import { etapeSuivante, libelleEtape, rangEtape, roleRequis } from './etapes';

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

  it('ont un rang qui suit l’ordre du parcours', () => {
    expect(ETAPES.map(rangEtape)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('etapeSuivante', () => {
  it.each([
    ['DETECTE', 'CERTIFICAT_OBTENU'],
    ['CERTIFICAT_OBTENU', 'DOSSIER_COMPLET'],
    ['DOSSIER_COMPLET', 'JUGEMENT_RENDU'],
    ['JUGEMENT_RENDU', 'TRANSCRIT'],
    ['TRANSCRIT', 'ACTE_REMIS'],
  ] as const)('après %s vient %s', (etape, suivante) => {
    expect(etapeSuivante(etape)).toBe(suivante);
  });

  it('ne rend rien après ACTE_REMIS : le dossier est terminé', () => {
    expect(etapeSuivante('ACTE_REMIS')).toBeNull();
  });
});

describe('roleRequis', () => {
  it.each([
    ['CERTIFICAT_OBTENU', 'ETAT_CIVIL'],
    ['DOSSIER_COMPLET', 'ECOLE'],
    ['JUGEMENT_RENDU', 'TRIBUNAL'],
    ['TRANSCRIT', 'ETAT_CIVIL'],
    ['ACTE_REMIS', 'ECOLE'],
  ] as const)('le passage à %s se saisit en %s', (etapeCible, role) => {
    expect(roleRequis(etapeCible)).toBe(role);
  });

  it('n’exige aucun rôle pour DETECTE : on n’y arrive jamais en avançant', () => {
    expect(roleRequis('DETECTE')).toBeNull();
  });

  it('n’exige jamais le superviseur : il ne saisit rien', () => {
    expect(ETAPES.map(roleRequis)).not.toContain('SUPERVISEUR');
    expect(ROLES).toContain('SUPERVISEUR');
  });
});
