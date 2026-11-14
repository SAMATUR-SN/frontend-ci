/** Corps d'erreur du backend (application/problem+json). Les 401 de route protégée n'en ont pas. */
export interface Probleme {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  erreurs?: ErreurChamp[];
}

export interface ErreurChamp {
  champ: string;
  message: string;
}
