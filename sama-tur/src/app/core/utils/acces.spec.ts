import { ROLES } from '../models/utilisateur.model';
import { ROLES_ALERTES, ROLES_IMPORT, ROLES_VERIFICATION, roleAutorise } from './acces';

describe('accès par rôle', () => {
  it('les alertes sont pour l’état civil, le tribunal et le superviseur, pas pour l’école', () => {
    expect([...ROLES_ALERTES]).toEqual(['ETAT_CIVIL', 'TRIBUNAL', 'SUPERVISEUR']);
    expect(roleAutorise('ECOLE', ROLES_ALERTES)).toBe(false);
  });

  it('seul l’état civil déclenche la vérification des retards', () => {
    expect(ROLES.filter((r) => roleAutorise(r, ROLES_VERIFICATION))).toEqual(['ETAT_CIVIL']);
  });

  it('seule l’école importe des élèves', () => {
    expect(ROLES.filter((r) => roleAutorise(r, ROLES_IMPORT))).toEqual(['ECOLE']);
  });

  it('n’autorise personne sans rôle', () => {
    expect(roleAutorise(null, ROLES_ALERTES)).toBe(false);
  });

  it('n’emploie que les quatre rôles du contrat', () => {
    for (const role of [...ROLES_ALERTES, ...ROLES_VERIFICATION, ...ROLES_IMPORT]) {
      expect(ROLES).toContain(role);
    }
  });
});
