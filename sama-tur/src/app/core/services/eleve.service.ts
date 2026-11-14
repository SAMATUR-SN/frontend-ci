import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RapportImport } from '../models/rapport-import.model';

@Injectable({
  providedIn: 'root',
})
export class EleveService {
  private readonly http = inject(HttpClient);

  /**
   * POST /api/eleves/import (école) : multipart, champ `file`, réponse JSON. Aucun Content-Type
   * n'est posé à la main : le navigateur ajoute la frontière du multipart.
   */
  importerCsv(file: File): Observable<RapportImport> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<RapportImport>('/api/eleves/import', formData);
  }
}
