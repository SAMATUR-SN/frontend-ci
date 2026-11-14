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

/**
 * Le rôle d'une ligne d'historique arrive en texte libre (`string | null`) : un rôle connu est
 * traduit, un autre est affiché tel quel, une absence donne un tiret.
 */
export function libelleRoleHistorique(role: string | null): string {
  if (!role) {
    return '—';
  }

  return Object.hasOwn(LIBELLES, role) ? libelleRole(role as Role) : role;
}
