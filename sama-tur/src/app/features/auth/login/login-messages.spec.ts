import {
  MESSAGE_ERREUR_GENERIQUE,
  MESSAGE_IDENTIFIANTS_REFUSES,
  MESSAGE_SERVEUR_INJOIGNABLE,
  MESSAGE_SESSION_EXPIREE,
  messageErreurConnexion,
} from './login-messages';

describe('messageErreurConnexion', () => {
  it('dit « Identifiant ou mot de passe incorrect. » pour un 401', () => {
    expect(messageErreurConnexion(401)).toBe('Identifiant ou mot de passe incorrect.');
    expect(messageErreurConnexion(401)).toBe(MESSAGE_IDENTIFIANTS_REFUSES);
  });

  it('dit « Serveur injoignable. » quand le statut est 0 (aucune réponse)', () => {
    expect(messageErreurConnexion(0)).toBe('Serveur injoignable.');
    expect(messageErreurConnexion(0)).toBe(MESSAGE_SERVEUR_INJOIGNABLE);
  });

  it.each([400, 403, 404, 429, 500, 502, 503])(
    'reste générique pour le statut %i, sans détail technique',
    (status) => {
      expect(messageErreurConnexion(status)).toBe(MESSAGE_ERREUR_GENERIQUE);
    },
  );

  it('rédige le message de session expirée comme demandé', () => {
    expect(MESSAGE_SESSION_EXPIREE).toBe('Votre session a expiré, reconnectez-vous.');
  });
});
