
import { Classe } from './classe.model';
import { Eleve, EleveDto } from './eleve.model';

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

/** Filtres de GET /api/dossiers. `enRetard` : true, false, ou absent pour tous. */
export interface FiltreDossiers {
  etape?: StatutDossier;
  communeId?: number;
  ecoleId?: number;
  classe?: Classe;
  enRetard?: boolean;
  q?: string;
}

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

export const PREUVES_NAISSANCE = ['CERTIFICAT_ACCOUCHEMENT', 'TEMOINS'] as const;
export type PreuveNaissance = (typeof PREUVES_NAISSANCE)[number];

export const TYPES_AUDIENCE = ['ORDINAIRE', 'SPECIALE', 'FORAINE'] as const;
export type TypeAudience = (typeof TYPES_AUDIENCE)[number];

export interface Temoin {
  nomComplet: string;
  numeroPiece: string;
}

/** Une ligne de l'historique : la ligne de création a etapeDepart à null. */
export interface HistoriqueEtape {
  etapeDepart: StatutDossier | null;
  etapeArrivee: StatutDossier;
  /** AAAA-MM-JJThh:mm:ss[.ffffff], sans fuseau (heure du serveur). */
  dateHeure: string;
  auteur: string | null;
  role: string | null;
  commentaire: string | null;
}

/** GET /api/dossiers/{id} : l'historique est dans le détail. */
export interface DossierDetail {
  id: number;
  reference: string;
  etape: StatutDossier;
  enRetard: boolean;
  joursDepuisJugement: number | null;
  eleve: EleveDto;
  dateDetection: string | null;
  numeroCertificat: string | null;
  dateCertificat: string | null;
  centreEtatCivilId: number | null;
  centreEtatCivil: string | null;
  preuveNaissance: PreuveNaissance | null;
  temoins: Temoin[];
  numeroJugement: string | null;
  dateJugement: string | null;
  tribunalId: number | null;
  tribunal: string | null;
  typeAudience: TypeAudience | null;
  numeroActe: string | null;
  anneeActe: number | null;
  dateTranscription: string | null;
  dateRemise: string | null;
  /** Du plus ancien au plus récent. */
  historique: HistoriqueEtape[];
}

/** POST /api/dossiers/{id}/avancer : seuls les champs de l'étape visée sont envoyés. */
export interface AvancerDossierRequest {
  etapeCible: StatutDossier;
  numeroCertificat?: string;
  dateCertificat?: string;
  centreEtatCivilId?: number;
  preuveNaissance?: PreuveNaissance;
  temoins?: Temoin[];
  numeroJugement?: string;
  dateJugement?: string;
  tribunalId?: number;
  typeAudience?: TypeAudience;
  numeroActe?: string;
  anneeActe?: number;
  dateTranscription?: string;
  dateRemise?: string;
  commentaire?: string;
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