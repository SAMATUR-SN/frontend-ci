import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DossierResume } from '../../../core/models/dossier.model';
import { Role } from '../../../core/models/utilisateur.model';
import { TokenStorage } from '../../../core/services/token-storage';
import { uneReponseConnexion } from '../../../core/testing/session-test';
import { ListeAlertes, messageVerification } from './liste-alertes';

function enRetard(id: number, surcharge: Partial<DossierResume> = {}): DossierResume {
  return {
    id,
    reference: `ST-2026-${String(id).padStart(6, '0')}`,
    eleve: { prenom: 'Awa', nom: `Test${id}`, classe: 'CM2', ecole: 'École de test' },
    communeNaissance: 'Bambey',
    etape: 'JUGEMENT_RENDU',
    dateDerniereEtape: '2026-09-20',
    enRetard: true,
    joursDepuisJugement: 40 + id,
    ...surcharge,
  };
}

describe('messageVerification', () => {
  it.each([
    [0, 'Aucune nouvelle alerte enregistrée.'],
    [1, '1 nouvelle alerte enregistrée.'],
    [2, '2 nouvelles alertes enregistrées.'],
    [12, '12 nouvelles alertes enregistrées.'],
  ])('%i → « %s »', (nombre, attendu) => {
    expect(messageVerification(nombre)).toBe(attendu);
  });
});

describe('ListeAlertes', () => {
  let fixture: ComponentFixture<ListeAlertes>;
  let controleur: HttpTestingController;

  const estAlertes = (r: { url: string }) => r.url === '/api/alertes';
  const page = () => fixture.nativeElement as HTMLElement;
  const texte = (selecteur: string) => page().querySelector(selecteur)?.textContent?.trim() ?? null;
  const bouton = (libelle: string) =>
    Array.from(page().querySelectorAll('button')).find((b) => b.textContent?.includes(libelle)) as
      HTMLButtonElement | undefined;

  function parametres(requete: TestRequest): Record<string, string> {
    const envoyes: Record<string, string> = {};
    for (const cle of requete.request.params.keys()) {
      envoyes[cle] = requete.request.params.get(cle) as string;
    }
    return envoyes;
  }

  function monter(role: Role = 'ETAT_CIVIL'): void {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [ListeAlertes],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(TokenStorage).enregistrer(uneReponseConnexion(role));
    controleur = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ListeAlertes);
    fixture.detectChanges();
  }

  /** Monte la page et répond à ses deux requêtes de démarrage. */
  function afficher(
    role: Role = 'ETAT_CIVIL',
    dossiers: DossierResume[] = [enRetard(1), enRetard(2)],
  ): void {
    monter(role);
    controleur.expectOne('/api/referentiels/communes').flush([
      { id: 3, nom: 'Bambey' },
      { id: 4, nom: 'Diourbel' },
    ]);
    controleur.expectOne(estAlertes).flush(dossiers);
    fixture.detectChanges();
  }

  afterEach(() => {
    controleur.verify();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('liste', () => {
    it('lit GET /api/alertes sans filtre au démarrage', () => {
      monter();

      const requete = controleur.expectOne(estAlertes);
      expect(requete.request.method).toBe('GET');
      expect(parametres(requete)).toEqual({});
      requete.flush([]);
      controleur.expectOne('/api/referentiels/communes').flush([]);
    });

    it('affiche un dossier par ligne, avec les jours depuis le jugement et un lien vers la fiche', () => {
      afficher('TRIBUNAL', [
        enRetard(7, { joursDepuisJugement: 55, communeNaissance: 'Diourbel' }),
      ]);

      const lignes = Array.from(page().querySelectorAll('tbody tr'));
      expect(lignes.length).toBe(1);
      const cellules = Array.from(lignes[0].querySelectorAll('td')).map((c) =>
        c.textContent?.trim(),
      );
      expect(cellules.slice(0, 5)).toEqual([
        'ST-2026-000007',
        'Awa Test7',
        'Diourbel',
        'Jugement rendu',
        '55',
      ]);
      expect(lignes[0].querySelector('a')?.getAttribute('href')).toBe('/dossiers/7');
    });

    it('garde l’ordre du backend : du jugement le plus ancien au plus récent', () => {
      afficher('TRIBUNAL', [
        enRetard(9, { joursDepuisJugement: 90 }),
        enRetard(2, { joursDepuisJugement: 60 }),
        enRetard(5, { joursDepuisJugement: 20 }),
      ]);

      const references = Array.from(page().querySelectorAll('tbody .reference')).map((c) =>
        c.textContent?.trim(),
      );
      expect(references).toEqual(['ST-2026-000009', 'ST-2026-000002', 'ST-2026-000005']);
    });

    it.each([
      [0, 'Aucun dossier en retard'],
      [1, '1 dossier en retard'],
      [5, '5 dossiers en retard'],
    ])('compte les dossiers : %i → « %s »', (nombre, attendu) => {
      afficher(
        'SUPERVISEUR',
        Array.from({ length: nombre }, (_, i) => enRetard(i + 1)),
      );

      expect(texte('.compteur')).toBe(attendu);
    });

    it('affiche « Aucun dossier en retard » quand la liste est vide', () => {
      afficher('SUPERVISEUR', []);

      expect(texte('.empty-state h3')).toBe('Aucun dossier en retard');
      expect(page().querySelector('table')).toBeNull();
    });

    it('affiche l’absence de jours ou de commune par un tiret', () => {
      afficher('TRIBUNAL', [enRetard(1, { joursDepuisJugement: null, communeNaissance: null })]);

      const cellules = Array.from(page().querySelectorAll('tbody td')).map((c) =>
        c.textContent?.trim(),
      );
      expect(cellules[2]).toBe('—');
      expect(cellules[4]).toBe('—');
    });

    it('relit la liste avec « Actualiser »', () => {
      afficher();

      bouton('Actualiser')?.click();

      controleur.expectOne(estAlertes).flush([enRetard(1)]);
      fixture.detectChanges();
      expect(texte('.compteur')).toBe('1 dossier en retard');
    });
  });

  describe('filtre par commune', () => {
    it('propose les communes et relance la liste avec communeId, puis sans', () => {
      afficher();
      const options = Array.from(page().querySelectorAll('#alertes-commune option')).map((o) =>
        o.textContent?.trim(),
      );
      expect(options).toEqual(['Toutes les communes', 'Bambey', 'Diourbel']);

      const select = page().querySelector('#alertes-commune') as HTMLSelectElement;
      select.value = '4';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      const filtre = controleur.expectOne(estAlertes);
      expect(parametres(filtre)).toEqual({ communeId: '4' });
      filtre.flush([enRetard(3)]);
      fixture.detectChanges();
      expect(texte('.compteur')).toBe('1 dossier en retard');

      select.value = '';
      select.dispatchEvent(new Event('change'));
      expect(parametres(controleur.expectOne(estAlertes))).toEqual({});
    });

    it('dit que la commune choisie n’a aucun dossier en retard', () => {
      afficher();
      const select = page().querySelector('#alertes-commune') as HTMLSelectElement;

      select.value = '3';
      select.dispatchEvent(new Event('change'));
      controleur.expectOne(estAlertes).flush([]);
      fixture.detectChanges();

      expect(texte('.empty-state p')).toContain('pour cette commune');
    });
  });

  describe('erreurs de chargement', () => {
    function enEchec(statut: number): void {
      monter('TRIBUNAL');
      controleur.expectOne('/api/referentiels/communes').flush([]);
      controleur.expectOne(estAlertes).flush(null, { status: statut, statusText: 'Erreur' });
      fixture.detectChanges();
    }

    it.each([
      [500, 'Impossible de charger'],
      [403, 'Votre rôle ne permet pas'],
    ])('%i : message clair et bouton « Réessayer »', (statut, extrait) => {
      enEchec(statut);

      expect(texte('.message-error')).toContain(extrait);
      expect(page().querySelector('table')).toBeNull();

      bouton('Réessayer')?.click();
      controleur.expectOne(estAlertes).flush([enRetard(1)]);
      fixture.detectChanges();
      expect(page().querySelector('.message-error')).toBeNull();
      expect(page().querySelectorAll('tbody tr').length).toBe(1);
    });

    it('serveur injoignable : le dit', () => {
      monter('TRIBUNAL');
      controleur.expectOne('/api/referentiels/communes').flush([]);
      controleur.expectOne(estAlertes).error(new ProgressEvent('error'));
      fixture.detectChanges();

      expect(texte('.message-error')).toContain('Serveur injoignable');
    });

    it('ne journalise rien dans la console', () => {
      const erreur = vi.spyOn(console, 'error');
      const journal = vi.spyOn(console, 'log');

      enEchec(500);

      expect(erreur).not.toHaveBeenCalled();
      expect(journal).not.toHaveBeenCalled();
    });
  });

  describe('vérification des retards', () => {
    it.each(['ECOLE', 'TRIBUNAL', 'SUPERVISEUR'] as const)(
      'le bouton « Vérifier les retards » n’existe pas pour %s',
      (role) => {
        afficher(role);

        expect(bouton('Vérifier')).toBeUndefined();
      },
    );

    it('le bouton existe pour l’état civil', () => {
      afficher('ETAT_CIVIL');

      expect(bouton('Vérifier les retards')).toBeDefined();
    });

    it('envoie POST /api/alertes/verifier et affiche le nombre d’alertes créées', () => {
      afficher('ETAT_CIVIL');

      bouton('Vérifier les retards')?.click();
      fixture.detectChanges();
      expect(bouton('Vérification')?.disabled).toBe(true);

      const requete = controleur.expectOne('/api/alertes/verifier');
      expect(requete.request.method).toBe('POST');
      requete.flush({ alertesCreees: 3 });
      fixture.detectChanges();

      expect(texte('.message-success')).toBe('3 nouvelles alertes enregistrées.');
      expect(bouton('Vérifier les retards')?.disabled).toBe(false);
    });

    it('dit « Aucune nouvelle alerte » quand tout est déjà enregistré', () => {
      afficher('ETAT_CIVIL');

      bouton('Vérifier les retards')?.click();
      controleur.expectOne('/api/alertes/verifier').flush({ alertesCreees: 0 });
      fixture.detectChanges();

      expect(texte('.message-success')).toBe('Aucune nouvelle alerte enregistrée.');
    });

    it('n’envoie pas deux vérifications en parallèle', () => {
      afficher('ETAT_CIVIL');
      const verifier = bouton('Vérifier les retards') as HTMLButtonElement;

      verifier.click();
      verifier.click();

      controleur.expectOne('/api/alertes/verifier').flush({ alertesCreees: 1 });
    });

    it('explique un refus 403 et un échec serveur', () => {
      afficher('ETAT_CIVIL');

      bouton('Vérifier les retards')?.click();
      controleur
        .expectOne('/api/alertes/verifier')
        .flush(
          { detail: 'Votre rôle ne permet pas cette action.' },
          { status: 403, statusText: 'Forbidden' },
        );
      fixture.detectChanges();
      expect(texte('.message-error')).toContain('Votre rôle ne permet pas de vérifier');

      bouton('Vérifier les retards')?.click();
      controleur
        .expectOne('/api/alertes/verifier')
        .flush(null, { status: 500, statusText: 'Erreur' });
      fixture.detectChanges();
      expect(texte('.message-error')).toContain('n’a pas pu être lancée');
    });
  });

  describe('plus de résolution', () => {
    it('n’affiche aucun bouton « Résoudre », ni de colonne de statut', () => {
      afficher('ETAT_CIVIL');

      expect(page().textContent).not.toContain('Résoudre');
      expect(page().textContent).not.toContain('Résolue');
      expect(page().querySelector('.btn-resolve')).toBeNull();
    });
  });
});
