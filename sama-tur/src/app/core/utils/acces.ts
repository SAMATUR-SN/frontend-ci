import { Role } from '../models/utilisateur.model';

/**
 * Qui voit quoi : une seule définition, partagée par les routes, le tableau de bord et les écrans.
 * L'interface restreint ; le backend, lui, laisse GET /api/alertes à tout utilisateur connecté.
 * Ce n'est donc pas une sécurité, seulement ce que chaque rôle a à faire.
 */
export const ROLES_ALERTES: readonly Role[] = ['ETAT_CIVIL', 'TRIBUNAL', 'SUPERVISEUR'];

/** Seul l'état civil déclenche la vérification des retards (POST /api/alertes/verifier). */
export const ROLES_VERIFICATION: readonly Role[] = ['ETAT_CIVIL'];

export const ROLES_IMPORT: readonly Role[] = ['ECOLE'];

export function roleAutorise(role: Role | null, roles: readonly Role[]): boolean {
  return role !== null && roles.includes(role);
}
