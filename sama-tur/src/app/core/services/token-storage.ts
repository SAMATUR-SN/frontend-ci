import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { ReponseConnexion } from '../models/reponse-connexion.model';
import { ROLES, Role, Utilisateur } from '../models/utilisateur.model';

const CLE_JETON = 'samatur_token';
const CLE_EXPIRATION = 'samatur_expire';
const CLE_UTILISATEUR = 'samatur_user';

/** Une valeur relue du stockage n'est pas fiable : on vérifie sa forme avant de s'y fier. */
function estUtilisateur(valeur: unknown): valeur is Utilisateur {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const candidat = valeur as Record<string, unknown>;
  return (
    typeof candidat['identifiant'] === 'string' &&
    typeof candidat['nomAffiche'] === 'string' &&
    ROLES.includes(candidat['role'] as Role) &&
    (candidat['structure'] === null || typeof candidat['structure'] === 'string')
  );
}

/**
 * Conserve la session (jeton, expiration, utilisateur) dans le sessionStorage : elle s'arrête
 * avec l'onglet. Limite connue : un script injecté (XSS) peut lire le jeton ; un cookie HttpOnly
 * l'éviterait mais demanderait de modifier le backend.
 *
 * Sûr côté serveur (SSR : aucun stockage, tout est vide) et tolérant quand le navigateur refuse le
 * stockage (mode privé strict, quota, politique du navigateur) : rien ne lève, la session est
 * simplement absente.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenStorage {
  private readonly platformId = inject(PLATFORM_ID);

  /** Le stockage de l'onglet, ou null côté serveur ou si le navigateur en refuse l'accès. */
  private stockage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }

  private lire(cle: string): string | null {
    try {
      return this.stockage()?.getItem(cle) ?? null;
    } catch {
      return null;
    }
  }

  enregistrer(reponse: ReponseConnexion): void {
    const stockage = this.stockage();
    if (!stockage) {
      return;
    }
    try {
      stockage.setItem(CLE_JETON, reponse.jeton);
      stockage.setItem(CLE_EXPIRATION, reponse.expireA);
      stockage.setItem(CLE_UTILISATEUR, JSON.stringify(reponse.utilisateur));
    } catch {
      // Écriture refusée (quota, stockage verrouillé) : pas de session à moitié enregistrée.
      this.clear();
    }
  }

  getToken(): string | null {
    return this.lire(CLE_JETON);
  }

  getUtilisateur(): Utilisateur | null {
    const brut = this.lire(CLE_UTILISATEUR);
    if (!brut) {
      return null;
    }
    try {
      const valeur: unknown = JSON.parse(brut);
      return estUtilisateur(valeur) ? valeur : null;
    } catch {
      return null;
    }
  }

  getRole(): Role | null {
    return this.getUtilisateur()?.role ?? null;
  }

  /**
   * Vrai quand la session n'est plus utilisable : date d'expiration atteinte, mais aussi absente
   * ou illisible (dans le doute, on redemande une connexion plutôt que d'envoyer un jeton douteux).
   */
  isExpired(): boolean {
    const expiration = Date.parse(this.lire(CLE_EXPIRATION) ?? '');
    return Number.isNaN(expiration) || expiration <= Date.now();
  }

  clear(): void {
    const stockage = this.stockage();
    if (!stockage) {
      return;
    }
    for (const cle of [CLE_JETON, CLE_EXPIRATION, CLE_UTILISATEUR]) {
      try {
        stockage.removeItem(cle);
      } catch {
        // Stockage inaccessible : il n'y a rien à effacer de plus.
      }
    }
  }
}
