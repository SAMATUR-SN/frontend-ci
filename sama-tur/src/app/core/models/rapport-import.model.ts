/** Une ligne du fichier refusée par le serveur. `ligne` est le numéro physique, en-tête compris. */
export interface ErreurImport {
  ligne: number;
  motif: string;
}

/** Réponse de POST /api/eleves/import : l'import se fait ligne à ligne, les autres lignes passent. */
export interface RapportImport {
  total: number;
  importes: number;
  rejetes: number;
  erreurs: ErreurImport[];
}
