import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Eleve, EleveRequest } from '../models/eleve.model';

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

  // Modifier un élève
  update(id: number, eleve: EleveRequest): Observable<Eleve> {
    return this.http.put<Eleve>(`${this.apiUrl}/${id}`, eleve);
  }

  // Supprimer un élève
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}