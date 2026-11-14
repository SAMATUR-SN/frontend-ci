import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Indicateurs } from '../models/indicateurs.model';

@Injectable({
  providedIn: 'root',
})
export class IndicateursService {
  private readonly http = inject(HttpClient);

  /**
   * GET /api/indicateurs. Sans argument : tous les dossiers, à la date du jour. Un filtre absent
   * n'est pas envoyé. `communeId` est la commune de naissance ; `dateReference` s'écrit AAAA-MM-JJ.
   */
  obtenir(communeId?: number | null, dateReference?: string): Observable<Indicateurs> {
    let params = new HttpParams();

    if (communeId !== undefined && communeId !== null) {
      params = params.set('communeId', communeId);
    }
    if (dateReference) {
      params = params.set('dateReference', dateReference);
    }

    return this.http.get<Indicateurs>('/api/indicateurs', { params });
  }
}
