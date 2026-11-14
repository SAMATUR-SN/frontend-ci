
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Dossier,
  HistoriqueDossier
} from '../models/dossier.model';


@Injectable({
  providedIn: 'root'
})
export class DossierService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/dossiers';

  // Récupérer tous les dossiers
  getAll(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(this.apiUrl);
  }

  // Récupérer un dossier par son identifiant
  getById(id: number): Observable<Dossier> {
    return this.http.get<Dossier>(`${this.apiUrl}/${id}`);
  }

    avancer(id: number): Observable<Dossier> {
    return this.http.post<Dossier>(
      `${this.apiUrl}/${id}/avancer`,
      {}
    );
   }

   getHistorique(id: number): Observable<HistoriqueDossier[]> {
  return this.http.get<HistoriqueDossier[]>(
    `${this.apiUrl}/${id}/historique`
  );
}
}
