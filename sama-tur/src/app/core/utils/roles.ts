import { Role } from '../models/utilisateur.model';

const LIBELLES: Record<Role, string> = {
  ECOLE: 'École',
  ETAT_CIVIL: 'État civil',
  TRIBUNAL: 'Tribunal',
  SUPERVISEUR: 'Superviseur',
};

export function libelleRole(role: Role): string {
  return LIBELLES[role] ?? role;
}
