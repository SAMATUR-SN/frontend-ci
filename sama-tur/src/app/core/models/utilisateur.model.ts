/** Les quatre rôles du backend, sans préfixe ni rôle d'administration. */
export const ROLES = ['ECOLE', 'ETAT_CIVIL', 'TRIBUNAL', 'SUPERVISEUR'] as const;

export type Role = (typeof ROLES)[number];

export interface Utilisateur {
  identifiant: string;
  nomAffiche: string;
  role: Role;
  /** Absente (null) pour le superviseur. */
  structure: string | null;
}
