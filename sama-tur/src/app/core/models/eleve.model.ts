// Commune renvoyée par le backend
export interface Commune {
  id: number;
  nom: string;
  departement: string | null;
  region: string | null;
}

/** @deprecated Ancienne forme imbriquée ; le référentiel renvoie l'Ecole de referentiel.model (bloc 5). */
export interface Ecole {
  id: number;
  nom: string;
  codeEcole: string | null;
  ief: string | null;
  commune: Commune | null;
}

// Référence utilisée pour envoyer un élève au backend
export interface EcoleReference {
  id: number;
}

export interface CommuneReference {
  id: number;
}

// Données envoyées pour créer ou modifier un élève
export interface EleveRequest {
  numeroIne: string | null;
  sexe: 'M' | 'F';
  nom: string;
  prenom: string;
  dateNaissance: string;
  dateNaissancePresumee?: boolean;
  classe: string;
  ecole: EcoleReference;
  communeNaissance: CommuneReference;
  nomPere?: string | null;
  professionPere?: string | null;
  nomMere?: string | null;
  professionMere?: string | null;
}

export type Langue = 'FRANCAIS' | 'WOLOF' | 'PULAAR' | 'SEREER';

/** Élève tel que le backend le renvoie : à plat, sans objets école ni commune imbriqués. */
export interface EleveDto {
  id: number;
  numeroIne: string | null;
  prenom: string;
  nom: string;
  sexe: 'F' | 'M';
  dateNaissance: string;
  dateNaissancePresumee: boolean | null;
  classe: string;
  ecoleId: number | null;
  ecole: string | null;
  communeNaissanceId: number | null;
  communeNaissance: string | null;
  nomPere: string | null;
  nomMere: string | null;
  telephoneParent: string | null;
  langueContact: Langue | null;
}

/** @deprecated Forme imbriquée de l'ancienne API ; remplacée par EleveDto (écrans élèves : bloc 5). */
export interface Eleve {
  id: number;
  numeroIne: string | null;
  sexe: 'M' | 'F';
  nom: string;
  prenom: string;
  dateNaissance: string;
  dateNaissancePresumee: boolean;
  classe: string;
  ecole: Ecole;
  communeNaissance: Commune;
  nomPere: string | null;
  professionPere: string | null;
  nomMere: string | null;
  professionMere: string | null;
}