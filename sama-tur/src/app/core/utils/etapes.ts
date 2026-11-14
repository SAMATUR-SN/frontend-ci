import { ETAPES, StatutDossier } from '../models/dossier.model';
import { Role } from '../models/utilisateur.model';

const LIBELLES: Record<StatutDossier, string> = {
  DETECTE: 'Détecté',
  CERTIFICAT_OBTENU: 'Certificat obtenu',
  DOSSIER_COMPLET: 'Dossier complet',
  JUGEMENT_RENDU: 'Jugement rendu',
  TRANSCRIT: 'Transcrit',
  ACTE_REMIS: 'Acte remis',
};

/** Rôle qui saisit le passage VERS chaque étape (contrat, section 4). */
const ROLES_PAR_ETAPE: Partial<Record<StatutDossier, Role>> = {
  CERTIFICAT_OBTENU: 'ETAT_CIVIL',
  DOSSIER_COMPLET: 'ECOLE',
  JUGEMENT_RENDU: 'TRIBUNAL',
  TRANSCRIT: 'ETAT_CIVIL',
  ACTE_REMIS: 'ECOLE',
};

export function libelleEtape(etape: StatutDossier): string {
  return LIBELLES[etape] ?? etape;
}

/** Position de l'étape dans le parcours (0 pour DETECTE). */
export function rangEtape(etape: StatutDossier): number {
  return ETAPES.indexOf(etape);
}

/** L'étape qui suit, ou null quand le dossier est terminé (ACTE_REMIS). */
export function etapeSuivante(etape: StatutDossier): StatutDossier | null {
  const rang = rangEtape(etape);

  return rang >= 0 && rang < ETAPES.length - 1 ? ETAPES[rang + 1] : null;
}

/** Rôle exigé pour passer à `etapeCible` ; null pour DETECTE, où l'on n'arrive jamais en avançant. */
export function roleRequis(etapeCible: StatutDossier): Role | null {
  return ROLES_PAR_ETAPE[etapeCible] ?? null;
}
