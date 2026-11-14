import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Role } from '../../../core/models/utilisateur.model';
import { TokenStorage } from '../../../core/services/token-storage';
import { uneReponseConnexion } from '../../../core/testing/session-test';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  async function monter(role?: Role): Promise<void> {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    if (role) {
      TestBed.inject(TokenStorage).enregistrer(uneReponseConnexion(role));
    }

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  const entete = () => (fixture.nativeElement as HTMLElement).querySelector('.user-details');

  afterEach(() => sessionStorage.clear());

  it('should create', async () => {
    await monter();

    expect(component).toBeTruthy();
  });

  it('affiche le nom, le rôle et la structure de l’utilisateur connecté', async () => {
    await monter('ETAT_CIVIL');

    expect(entete()?.textContent).toContain('Utilisateur de test');
    expect(entete()?.textContent).toContain('État civil');
    expect(entete()?.textContent).toContain('Structure de test');
  });

  it('n’affiche pas de structure pour le superviseur', async () => {
    await monter('SUPERVISEUR');

    expect(entete()?.textContent).toContain('Superviseur');
    expect(entete()?.textContent).not.toContain('Structure de test');
    expect(entete()?.querySelectorAll('small').length).toBe(1);
  });

  it('ne connaît pas de rôle d’administration', async () => {
    await monter('ECOLE');

    expect(entete()?.textContent).not.toContain('Administrateur');
    expect(entete()?.textContent).toContain('École');
  });
});
