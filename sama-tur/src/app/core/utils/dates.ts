const ABSENTE = '—';

/**
 * Affiche une date du backend (AAAA-MM-JJ, ou dateHeure AAAA-MM-JJThh:mm:ss) en jj/MM/aaaa.
 * Travaille sur la chaîne, sans objet Date : aucun décalage de fuseau possible.
 */
export function formaterDate(valeur: string | null | undefined): string {
  const trouve = /^(\d{4})-(\d{2})-(\d{2})/.exec(valeur ?? '');

  return trouve ? `${trouve[3]}/${trouve[2]}/${trouve[1]}` : ABSENTE;
}

/**
 * Affiche une dateHeure du backend en jj/MM/aaaa HH:mm. La dateHeure n'a pas de fuseau : elle est
 * affichée telle quelle, jamais convertie. Sans heure, seule la date est rendue.
 */
export function formaterDateHeure(valeur: string | null | undefined): string {
  const trouve = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(valeur ?? '');

  return trouve
    ? `${trouve[3]}/${trouve[2]}/${trouve[1]} ${trouve[4]}:${trouve[5]}`
    : formaterDate(valeur);
}
