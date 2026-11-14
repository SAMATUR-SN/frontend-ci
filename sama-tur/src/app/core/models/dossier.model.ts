
import { Eleve } from './eleve.model';

/** Les six étapes du contrat, dans l'ordre. */
export const ETAPES = [
  'DETECTE',
  'CERTIFICAT_OBTENU',
  'DOSSIER_COMPLET',
  'JUGEMENT_RENDU',
  'TRANSCRIT',
  'ACTE_REMIS'
] as const;

export type StatutDossier = (typeof ETAPES)[number];

/** Tris acceptés par GET /api/dossiers (tout autre tri renvoie 400). */
export const TRIS_DOSSIERS = [
  'dateDetection,desc',
  'dateDetection,asc',
  'dateJugement,desc',
  'dateJugement,asc',
  'reference,asc',
  'reference,desc'
] as const;

export type TriDossiers = (typeof TRIS_DOSSIERS)[number];

/** Une ligne de GET /api/dossiers. */
export interface DossierResume {
  id: number;
  reference: string;
  eleve: { prenom: string; nom: string; classe: string; ecole: string | null };
  communeNaissance: string | null;
  etape: StatutDossier;
  dateDerniereEtape: string | null;
  enRetard: boolean;
  joursDepuisJugement: number | null;
}

/** @deprecated Ancienne énumération à 7 étapes (CERTIFICAT_ETABLI n'existe plus). Retirée au bloc 3. */
export type StatutDossierAncien =
  | 'DETECTE'
  | 'CERTIFICAT_OBTENU'
  | 'CERTIFICAT_ETABLI'
  | 'DOSSIER_COMPLET'
  | 'JUGEMENT_RENDU'
  | 'TRANSCRIT'
  | 'ACTE_REMIS';

export interface CentreEtatCivil {
  id: number;
  nom: string;
  communeId: number;
}

export interface TribunalInstance {
  id: number;
  nom: string;
  ville: string;
}

/** @deprecated Remplacé par DossierResume (liste) et DossierDetail (fiche, bloc 2b). */
export interface Dossier {
  id: number;
  reference: string;
  eleve: Eleve;
  etape: StatutDossierAncien;

  dateDetection: string | null;

  numeroCertificat: string | null;
  dateCertificat: string | null;

  numeroJugement: string | null;
  dateJugement: string | null;
  typeAudience: string | null;

  numeroActe: string | null;
  dateTranscription: string | null;
  dateRemise: string | null;

  centreEtatCivil: CentreEtatCivil | null;
  tribunalInstance: TribunalInstance | null;

  version: number | null;
}

export interface HistoriqueDossier {
  id: number;
  dossier: Record<string, unknown>;
  etapeDepart: string;
  etapeArrivee: string;
  dateHeure: string;
  auteurId: number;
  roleAuteur: string;
  commentaire: string;
}