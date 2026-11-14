import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Eleve,
  EleveRequest,
  Ecole,
  Commune
} from '../models/eleve.model';
import { RapportImport } from '../models/rapport-import.model';

@Injectable({
  providedIn: 'root'
})
export class EleveService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/eleves';

  // Récupérer tous les élèves
  getAll(): Observable<Eleve[]> {
    return this.http.get<Eleve[]>(this.apiUrl);
  }

  

  // Récupérer un élève par son ID
  getById(id: number): Observable<Eleve> {
    return this.http.get<Eleve>(`${this.apiUrl}/${id}`);
  }

  // Ajouter un élève
  create(eleve: EleveRequest): Observable<Eleve> {
    return this.http.post<Eleve>(this.apiUrl, eleve);
  }
getEcoles(): Observable<Ecole[]> {
  return this.http.get<Ecole[]>('/api/referentiels/ecoles');
}

getCommunes(): Observable<Commune[]> {
  return this.http.get<Commune[]>('/api/referentiels/communes');
}
  // Modifier un élève
  update(id: number, eleve: EleveRequest): Observable<Eleve> {
    return this.http.put<Eleve>(`${this.apiUrl}/${id}`, eleve);
  }

  // Supprimer un élève
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


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