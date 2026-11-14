import { HttpErrorResponse } from '@angular/common/http';

import { ErreurChamp } from '../models/probleme.model';

export interface ProblemeExtrait {
  status: number;
  titre: string;
  detail: string;
  erreurs: ErreurChamp[];
}

/**
 * Lit une erreur d'appel HTTP sans jamais lever : corps problem+json, corps vide (401 d'une route
 * protégée), texte non JSON ou absence de réponse (status 0). Les champs absents valent '' ou [].
 */
export function extraireProbleme(erreur: unknown): ProblemeExtrait {
  if (!(erreur instanceof HttpErrorResponse)) {
    return { status: 0, titre: '', detail: '', erreurs: [] };
  }

  const corps = lireCorps(erreur.error);

  return {
    status: erreur.status,
    titre: texte(corps['title']),
    detail: texte(corps['detail']),
    erreurs: lireErreurs(corps['erreurs']),
  };
}

function lireCorps(brut: unknown): Record<string, unknown> {
  let valeur = brut;

  if (typeof valeur === 'string') {
    try {
      valeur = JSON.parse(valeur);
    } catch {
      return {};
    }
  }

  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
    ? (valeur as Record<string, unknown>)
    : {};
}

function texte(valeur: unknown): string {
  return typeof valeur === 'string' ? valeur : '';
}

function lireErreurs(valeur: unknown): ErreurChamp[] {
  if (!Array.isArray(valeur)) {
    return [];
  }

  return valeur
    .filter(
      (e): e is Record<string, unknown> =>
        typeof e === 'object' && e !== null && typeof e['champ'] === 'string',
    )
    .map((e) => ({ champ: e['champ'] as string, message: texte(e['message']) }));
}
