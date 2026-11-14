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
