import { ReponseConnexion } from '../models/reponse-connexion.model';
import { Role, Utilisateur } from '../models/utilisateur.model';

/** Données fictives pour les tests : aucun vrai compte, aucun vrai jeton. */
export function unUtilisateur(role: Role = 'ECOLE'): Utilisateur {
  return {
    identifiant: 'test@samatur.sn',
    nomAffiche: 'Utilisateur de test',
    role,
    structure: role === 'SUPERVISEUR' ? null : 'Structure de test',
  };
}

/** Une réponse de connexion valable `valideMs` millisecondes (négatif : déjà expirée). */
export function uneReponseConnexion(
  role: Role = 'ECOLE',
  valideMs: number = 8 * 60 * 60 * 1000,
): ReponseConnexion {
  return {
    jeton: 'jeton-de-test',
    expireA: new Date(Date.now() + valideMs).toISOString(),
    utilisateur: unUtilisateur(role),
  };
}
