
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { LoginRequest } from '../models/login-request.model';
import { ReponseConnexion } from '../models/reponse-connexion.model';
import { TokenStorage } from './token-storage';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorage);

  private readonly apiUrl = '/api/auth/connexion';

  login(credentials: LoginRequest): Observable<ReponseConnexion> {
    return this.http
      .post<ReponseConnexion>(this.apiUrl, credentials)
      .pipe(tap((reponse) => this.tokenStorage.enregistrer(reponse)));
  }

  logout(): void {
    this.tokenStorage.clear();
  }

  getToken(): string | null {
    return this.tokenStorage.getToken();
  }
}
