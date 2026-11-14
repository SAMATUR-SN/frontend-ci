
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { LoginRequest } from '../models/login-request.model';
import { JwtResponse } from '../models/jwt-response.model';
import { TokenStorage } from './token-storage';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorage);

  private readonly apiUrl = '/api/auth/connexion';

  login(credentials: LoginRequest): Observable<JwtResponse> {
  return this.http.post<JwtResponse>(this.apiUrl, credentials).pipe(
    tap((response) => {
      this.tokenStorage.saveToken(response.token);
      this.tokenStorage.saveUser(response);
    })
  );
  }

  logout(): void {
    this.tokenStorage.removeToken();
  }

  getToken(): string | null {
    return this.tokenStorage.getToken();
  }
}
