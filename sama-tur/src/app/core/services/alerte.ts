import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alerte } from '../models/alerte.model';

@Injectable({
  providedIn: 'root'
})
export class AlerteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/alertes';

  getAll(): Observable<Alerte[]> {
    return this.http.get<Alerte[]>(this.apiUrl);
  }

  verifier(): Observable<string> {
    return this.http.post('/api/alertes/verifier', null, {
      responseType: 'text'
    });
  }

  resoudre(id: number): Observable<Alerte> {
    return this.http.patch<Alerte>(
      `${this.apiUrl}/${id}/resoudre`,
      null
    );
  }
}