import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TokenStorage } from '../../../core/services/token-storage';
import { uneReponseConnexion } from '../../../core/testing/session-test';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let controleur: HttpTestingController;
  let navigation: ReturnType<typeof vi.spyOn>;

  /** Monte l'écran ; `raison` simule /login?raison=… */
  async function monter(raison?: string): Promise<void> {
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...(raison
          ? [
              {
                provide: ActivatedRoute,
                useValue: { queryParamMap: of(convertToParamMap({ raison })) },
              },
            ]
          : []),
      ],
    });
    await TestBed.compileComponents();

    navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    controleur = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
  }

  const page = () => fixture.nativeElement as HTMLElement;
  const bandeauErreur = () => page().querySelector('.error-message');
  const bandeauSession = () => page().querySelector('.info-message');
  const bouton = () => page().querySelector('button[type="submit"]') as HTMLButtonElement;

  function saisir(identifiant: string, motDePasse: string): void {
    for (const [selecteur, valeur] of [
      ['#identifiant', identifiant],
      ['#motDePasse', motDePasse],
    ]) {
      const champ = page().querySelector(selecteur) as HTMLInputElement;
      champ.value = valeur;
      champ.dispatchEvent(new Event('input'));
    }
  }

  function soumettre(): void {
    (page().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  beforeEach(() => sessionStorage.clear());

  afterEach(() => {
    controleur.verify();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('should create', async () => {
    await monter();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('n’appelle pas l’API quand le formulaire est vide, et réclame les deux champs', async () => {
    await monter();

    soumettre();

    controleur.expectNone('/api/auth/connexion');
    expect(page().textContent).toContain("L'identifiant est obligatoire.");
    expect(page().textContent).toContain('Le mot de passe est obligatoire.');
  });

  it('connecte, enregistre la session et redirige vers /dashboard', async () => {
    await monter();
    const journal = vi.spyOn(console, 'log');
    saisir('test@samatur.sn', 'secret-de-test');

    soumettre();
    const requete = controleur.expectOne('/api/auth/connexion');
    expect(requete.request.body).toEqual({
      identifiant: 'test@samatur.sn',
      motDePasse: 'secret-de-test',
    });
    requete.flush(uneReponseConnexion('TRIBUNAL'));
    await fixture.whenStable();

    expect(TestBed.inject(TokenStorage).getRole()).toBe('TRIBUNAL');
    expect(navigation).toHaveBeenCalledWith(['/dashboard']);
    expect(bandeauErreur()).toBeNull();
    expect(journal).not.toHaveBeenCalled();
  });

  it('désactive le bouton pendant l’envoi, puis le réactive après un échec', async () => {
    await monter();
    saisir('test@samatur.sn', 'faux');

    soumettre();
    expect(bouton().disabled).toBe(true);
    expect(bouton().textContent).toContain('Connexion en cours');

    controleur
      .expectOne('/api/auth/connexion')
      .flush({ detail: 'refusé' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(bouton().disabled).toBe(false);
  });

  it('affiche « Identifiant ou mot de passe incorrect. » sur un 401, sans redirection', async () => {
    await monter();
    saisir('test@samatur.sn', 'faux');

    soumettre();
    controleur
      .expectOne('/api/auth/connexion')
      .flush({ detail: 'refusé' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(bandeauErreur()?.textContent).toContain('Identifiant ou mot de passe incorrect.');
    expect(navigation).not.toHaveBeenCalled();
    expect(TestBed.inject(TokenStorage).getToken()).toBeNull();
  });

  it('affiche « Serveur injoignable. » quand le serveur ne répond pas (statut 0)', async () => {
    await monter();
    saisir('test@samatur.sn', 'x');

    soumettre();
    controleur.expectOne('/api/auth/connexion').error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(bandeauErreur()?.textContent).toContain('Serveur injoignable.');
  });

  it('affiche un message générique, sans détail technique, pour une erreur serveur', async () => {
    await monter();
    saisir('test@samatur.sn', 'x');

    soumettre();
    controleur
      .expectOne('/api/auth/connexion')
      .flush({ detail: 'NullPointerException interne' }, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    expect(bandeauErreur()?.textContent).toContain('La connexion a échoué.');
    expect(page().textContent).not.toContain('NullPointerException');
  });

  describe('retour après une fin de session (?raison=session)', () => {
    it('explique que la session a expiré', async () => {
      await monter('session');

      expect(bandeauSession()?.textContent).toContain('Votre session a expiré, reconnectez-vous.');
    });

    it('n’affiche rien de tel sur une visite ordinaire', async () => {
      await monter();

      expect(bandeauSession()).toBeNull();
    });

    it('ignore une autre raison', async () => {
      await monter('autre');

      expect(bandeauSession()).toBeNull();
    });

    it('cède la place au message d’erreur quand la reconnexion échoue', async () => {
      await monter('session');
      saisir('test@samatur.sn', 'faux');

      soumettre();
      controleur
        .expectOne('/api/auth/connexion')
        .flush({ detail: 'refusé' }, { status: 401, statusText: 'Unauthorized' });
      await fixture.whenStable();

      expect(bandeauSession()).toBeNull();
      expect(bandeauErreur()?.textContent).toContain('Identifiant ou mot de passe incorrect.');
    });
  });
});
