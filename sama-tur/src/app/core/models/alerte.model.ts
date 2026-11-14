/** Réponse de POST /api/alertes/verifier. */
export interface VerificationAlertes {
  /** Nombre de nouvelles alertes enregistrées (au plus une par dossier en retard). */
  alertesCreees: number;
}
