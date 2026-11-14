
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JwtResponse } from '../models/jwt-response.model';

@Injectable({
  providedIn: 'root'
})
export class TokenStorage {

  private readonly platformId = inject(PLATFORM_ID);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  saveToken(token: string): void {
    if (this.isBrowser()) {
      localStorage.setItem('samatur_token', token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem('samatur_token');
    }

    return null;
  }

  saveUser(response: JwtResponse): void {
    if (this.isBrowser()) {
      localStorage.setItem(
        'samatur_user',
        JSON.stringify({
          id: response.id,
          identifiant: response.identifiant,
          roles: response.roles
        })
      );
    }
  }

  getUser(): {
    id: number;
    identifiant: string;
    roles: string[];
  } | null {

    if (!this.isBrowser()) {
      return null;
    }

    const user = localStorage.getItem('samatur_user');

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }

  // Normalisation des rôles :
  // ROLE_ECOLE devient ECOLE
  // ROLE_ADMIN devient ADMIN
  getRoles(): string[] {

    const roles = this.getUser()?.roles ?? [];

    return roles.map(role =>
      role.replace(/^ROLE_/, '').toUpperCase()
    );
  }

  hasRole(rolesAutorises: string[]): boolean {

    const rolesUtilisateur = this.getRoles();

    const rolesNormalises = rolesAutorises.map(role =>
      role.replace(/^ROLE_/, '').toUpperCase()
    );

    return rolesUtilisateur.some(role =>
      rolesNormalises.includes(role)
    );
  }

  removeToken(): void {

    if (this.isBrowser()) {
      localStorage.removeItem('samatur_token');
      localStorage.removeItem('samatur_user');
    }
  }
}
