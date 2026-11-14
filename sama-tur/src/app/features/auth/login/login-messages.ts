export const MESSAGE_IDENTIFIANTS_REFUSES = 'Identifiant ou mot de passe incorrect.';
export const MESSAGE_SERVEUR_INJOIGNABLE = 'Serveur injoignable.';
export const MESSAGE_ERREUR_GENERIQUE = 'La connexion a échoué. Réessayez dans un instant.';
export const MESSAGE_SESSION_EXPIREE = 'Votre session a expiré, reconnectez-vous.';

/**
 * Message affiché sous le formulaire pour un échec de connexion, d'après le statut HTTP :
 * 401 identifiants refusés, 0 serveur injoignable (réseau coupé, backend arrêté), le reste
 * générique. On n'affiche jamais le détail technique de l'erreur.
 */
export function messageErreurConnexion(status: number): string {
  if (status === 401) {
    return MESSAGE_IDENTIFIANTS_REFUSES;
  }
  if (status === 0) {
    return MESSAGE_SERVEUR_INJOIGNABLE;
  }
  return MESSAGE_ERREUR_GENERIQUE;
}
