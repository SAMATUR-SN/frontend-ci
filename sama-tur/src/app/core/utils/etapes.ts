import { StatutDossier } from '../models/dossier.model';

const LIBELLES: Record<StatutDossier, string> = {
  DETECTE: 'Détecté',
  CERTIFICAT_OBTENU: 'Certificat obtenu',
  DOSSIER_COMPLET: 'Dossier complet',
  JUGEMENT_RENDU: 'Jugement rendu',
  TRANSCRIT: 'Transcrit',
  ACTE_REMIS: 'Acte remis',
};

export function libelleEtape(etape: StatutDossier): string {
  return LIBELLES[etape] ?? etape;
}
