import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { VerificationAlertes } from '../models/alerte.model';
import { DossierResume } from '../models/dossier.model';

@Injectable({
  providedIn: 'root',
})
export class AlerteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/alertes';

  /**
   * GET /api/alertes : les dossiers en retard (jugés, non transcrits au-delà du délai cible), du
   * plus ancien jugement au plus récent, sans pagination. Ce ne sont pas des alertes enregistrées :
   * aucune route ne donne leur identifiant, donc rien ne peut se « résoudre » depuis l'interface.
   */
  listerEnRetard(communeId?: number | null): Observable<DossierResume[]> {
    let params = new HttpParams();

    if (communeId !== undefined && communeId !== null) {
      params = params.set('communeId', communeId);
    }

    return this.http.get<DossierResume[]>(this.apiUrl, { params });
  }

  /** POST /api/alertes/verifier (état civil) : enregistre les alertes des nouveaux retards. */
  verifier(): Observable<VerificationAlertes> {
    return this.http.post<VerificationAlertes>(`${this.apiUrl}/verifier`, null);
  }
}
