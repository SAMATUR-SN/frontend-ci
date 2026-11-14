
import { Eleve } from './eleve.model';

export type StatutDossier =
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

export interface Dossier {
  id: number;
  reference: string;
  eleve: Eleve;
  etape: StatutDossier;

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

export interface CreationDossierRequest {
  reference: string;
  eleveId: number;
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