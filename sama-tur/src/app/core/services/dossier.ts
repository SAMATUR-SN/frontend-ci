
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Dossier,
  DossierResume,
  FiltreDossiers,
  HistoriqueDossier,
  TriDossiers
} from '../models/dossier.model';
import { Page } from '../models/page.model';


@Injectable({
  providedIn: 'root'
})
export class DossierService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/dossiers';

  /**
   * Liste paginée (GET /api/dossiers). Un filtre absent n'est pas envoyé ; `enRetard: false` l'est
   * (« pas en retard » est une vraie valeur, distincte de « tous »). `page` commence à 0.
   */
  lister(
    filtre: FiltreDossiers = {},
    page = 0,
    taille = 20,
    tri?: TriDossiers
  ): Observable<Page<DossierResume>> {
    const valeurs: Record<string, string | number | boolean | undefined> = {
      etape: filtre.etape,
      communeId: filtre.communeId,
      ecoleId: filtre.ecoleId,
      classe: filtre.classe,
      enRetard: filtre.enRetard,
      q: filtre.q?.trim(),
      tri
    };

    let params = new HttpParams().set('page', page).set('taille', taille);

    for (const [cle, valeur] of Object.entries(valeurs)) {
      if (valeur !== undefined && valeur !== null && valeur !== '') {
        params = params.set(cle, String(valeur));
      }
    }

    return this.http.get<Page<DossierResume>>(this.apiUrl, { params });
  }

  /** @deprecated Réponse paginée côté backend ; remplacée par lister (tableau de bord : bloc 3). */
  getAll(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(this.apiUrl);
  }

  /** @deprecated Remplacée par trouver (bloc 2b). */
  getById(id: number): Observable<Dossier> {
    return this.http.get<Dossier>(`${this.apiUrl}/${id}`);
  }

  /** @deprecated Envoie un corps vide ; le backend exige etapeCible et les champs de l'étape (bloc 2b). */
  avancer(id: number): Observable<Dossier> {
    return this.http.post<Dossier>(
      `${this.apiUrl}/${id}/avancer`,
      {}
    );
   }

  /** @deprecated Cette route n'existe pas : l'historique est dans le détail du dossier (bloc 2b). */
  getHistorique(id: number): Observable<HistoriqueDossier[]> {
  return this.http.get<HistoriqueDossier[]>(
    `${this.apiUrl}/${id}/historique`
  );
}
}
