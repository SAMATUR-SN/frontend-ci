import { Utilisateur } from './utilisateur.model';

/** Réponse de POST /api/auth/connexion. */
export interface ReponseConnexion {
  jeton: string;
  /** Instant ISO avec fuseau, par exemple 2026-11-05T11:00:00Z. */
  expireA: string;
  utilisateur: Utilisateur;
}
