/** Commune, centre d'état civil ou tribunal : un identifiant et un nom. */
export interface Option {
  id: number;
  nom: string;
}

export interface Ecole {
  id: number;
  code: string;
  nom: string;
  communeId: number | null;
}
