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

// Données reçues du backend
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