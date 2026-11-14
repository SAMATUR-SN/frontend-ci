import { ROLES } from '../models/utilisateur.model';
import { libelleRole, libelleRoleHistorique } from './roles';

describe('libelleRole', () => {
  it('donne un libellé français aux quatre rôles', () => {
    expect(ROLES.map(libelleRole)).toEqual(['École', 'État civil', 'Tribunal', 'Superviseur']);
  });
});

describe('libelleRoleHistorique', () => {
  it('traduit un rôle connu', () => {
    expect(libelleRoleHistorique('ETAT_CIVIL')).toBe('État civil');
  });

  it('garde tel quel un rôle inconnu', () => {
    expect(libelleRoleHistorique('AUTRE')).toBe('AUTRE');
  });

  it('rend un tiret quand le rôle est absent', () => {
    expect(libelleRoleHistorique(null)).toBe('—');
    expect(libelleRoleHistorique('')).toBe('—');
  });

  it('ne prend pas une propriété héritée pour un rôle', () => {
    expect(libelleRoleHistorique('constructor')).toBe('constructor');
  });
});
