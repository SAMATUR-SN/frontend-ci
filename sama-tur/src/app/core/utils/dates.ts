const ABSENTE = '—';

/**
 * Affiche une date du backend (AAAA-MM-JJ, ou dateHeure AAAA-MM-JJThh:mm:ss) en jj/MM/aaaa.
 * Travaille sur la chaîne, sans objet Date : aucun décalage de fuseau possible.
 */
export function formaterDate(valeur: string | null | undefined): string {
  const trouve = /^(\d{4})-(\d{2})-(\d{2})/.exec(valeur ?? '');

  return trouve ? `${trouve[3]}/${trouve[2]}/${trouve[1]}` : ABSENTE;
}
