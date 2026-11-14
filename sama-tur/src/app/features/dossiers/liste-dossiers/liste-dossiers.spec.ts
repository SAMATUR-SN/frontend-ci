import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DossierResume } from '../../../core/models/dossier.model';
import { Page } from '../../../core/models/page.model';
import { ListeDossiers } from './liste-dossiers';

function unDossier(id: number, surcharge: Partial<DossierResume> = {}): DossierResume {
  return {
    id,
    reference: `ST-2026-${String(id).padStart(6, '0')}`,
    eleve: { prenom: 'Awa', nom: `Test${id}`, classe: 'CM2', ecole: 'École de test' },
    communeNaissance: 'Bambey',
    etape: 'DETECTE',
    dateDerniereEtape: '2026-10-05',
    enRetard: false,
    joursDepuisJugement: null,
    ...surcharge,
  };
}

function unePage(
  contenu: DossierResume[],
  options: { page?: number; totalPages?: number; total?: number } = {},
): Page<DossierResume> {
  return {
    contenu,
    page: options.page ?? 0,
    taille: 20,
    totalElements: options.total ?? contenu.length,
    totalPages: options.totalPages ?? 1,
  };
}

describe('ListeDossiers', () => {
  let fixture: ComponentFixture<ListeDossiers>;
  let controleur: HttpTestingController;

  const estListe = (r: { url: string }) => r.url === '/api/dossiers';
  const page = () => fixture.nativeElement as HTMLElement;
  const lignes = () => Array.from(page().querySelectorAll('tbody tr'));
  const bouton = (libelle: string) =>
    Array.from(page().querySelectorAll('button')).find((b) =>
      b.textContent?.includes(libelle),
    ) as HTMLButtonElement;

  function parametres(requete: TestRequest): Record<string, string> {
    const envoyes: Record<string, string> = {};
    for (const cle of requete.request.params.keys()) {
      envoyes[cle] = requete.request.params.get(cle) as string;
    }
    return envoyes;
  }

  /** Répond à la requête de liste en attente, et rend les paramètres qu'elle portait. */
  function repondre(reponse: Page<DossierResume>): Record<string, string> {
    const requete = controleur.expectOne(estListe);
    const envoyes = parametres(requete);
    requete.flush(reponse);
    fixture.detectChanges();
    return envoyes;
  }

  function monter(premierePage = unePage([unDossier(1), unDossier(2)])): Record<string, string> {
    TestBed.configureTestingModule({
      imports: [ListeDossiers],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controleur = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ListeDossiers);

    controleur.expectOne('/api/referentiels/communes').flush([
      { id: 1, nom: 'Bambey' },
      { id: 2, nom: 'Diourbel' },
    ]);
    controleur
      .expectOne('/api/referentiels/ecoles')
      .flush([{ id: 7, code: 'ECO-BAM-01', nom: 'École de test', communeId: 1 }]);

    return repondre(premierePage);
  }

  function choisir(id: string, valeur: string): void {
    const champ = page().querySelector(`#${id}`) as HTMLSelectElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function saisir(valeur: string): void {
    const champ = page().querySelector('#f-recherche') as HTMLInputElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  afterEach(() => {
    controleur.verify();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('affichage', () => {
    it('charge la première page triée par détection décroissante, sans filtre', () => {
      const envoyes = monter();

      expect(envoyes).toEqual({ page: '0', taille: '20', tri: 'dateDetection,desc' });
    });

    it('affiche une ligne par dossier avec ses colonnes', () => {
      monter(unePage([unDossier(1, { etape: 'JUGEMENT_RENDU', dateDerniereEtape: '2026-10-05' })]));

      expect(lignes().length).toBe(1);
      const texte = lignes()[0].textContent ?? '';
      expect(texte).toContain('ST-2026-000001');
      expect(texte).toContain('Awa Test1');
      expect(texte).toContain('CM2');
      expect(texte).toContain('École de test');
      expect(texte).toContain('Bambey');
      expect(texte).toContain('Jugement rendu');
      expect(texte).toContain('05/10/2026');
    });

    it('remplace une école ou une commune absente par un tiret', () => {
      monter(
        unePage([
          unDossier(1, {
            communeNaissance: null,
            eleve: { prenom: 'Awa', nom: 'Test', classe: 'CE1', ecole: null },
          }),
        ]),
      );

      const cellules = Array.from(lignes()[0].querySelectorAll('td')).map((c) =>
        c.textContent?.trim(),
      );
      expect(cellules[3]).toBe('—');
      expect(cellules[4]).toBe('—');
    });

    it('affiche le nombre total de dossiers de la réponse, pas seulement ceux de la page', () => {
      monter(unePage([unDossier(1)], { total: 40, totalPages: 2 }));

      expect(page().querySelector('.stats-card strong')?.textContent).toBe('40');
    });

    it('signale un dossier en retard et les jours écoulés depuis le jugement', () => {
      monter(unePage([unDossier(1, { enRetard: true, joursDepuisJugement: 42 })]));

      expect(page().querySelector('.badge-retard')?.textContent).toContain('En retard');
      expect(page().querySelector('.jours')?.textContent).toContain('42 j depuis le jugement');
    });

    it('n’affiche pas de badge pour un dossier à l’heure, mais garde les jours connus', () => {
      monter(unePage([unDossier(1, { enRetard: false, joursDepuisJugement: 5 })]));

      expect(page().querySelector('.badge-retard')).toBeNull();
      expect(page().querySelector('.jours')?.textContent).toContain('5 j depuis le jugement');
    });

    it('n’affiche rien dans la colonne retard quand le jugement n’a pas eu lieu', () => {
      monter(unePage([unDossier(1)]));

      expect(page().querySelector('.badge-retard')).toBeNull();
      expect(page().querySelector('.jours')).toBeNull();
    });

    it('mène chaque ligne à la fiche du dossier', () => {
      monter(unePage([unDossier(12), unDossier(34)]));

      const liens = page().querySelectorAll('a.btn-detail');
      expect(liens[0].getAttribute('href')).toBe('/dossiers/12');
      expect(liens[1].getAttribute('href')).toBe('/dossiers/34');
    });

    it('ne propose plus de création de dossier', () => {
      monter();

      expect(page().innerHTML).not.toContain('dossiers/nouveau');
      expect(page().textContent).not.toContain('Nouveau dossier');
    });

    it('alimente les filtres commune et école avec le référentiel', () => {
      monter();

      const communes = Array.from(page().querySelectorAll('#f-commune option')).map((o) =>
        o.textContent?.trim(),
      );
      const ecoles = Array.from(page().querySelectorAll('#f-ecole option')).map((o) =>
        o.textContent?.trim(),
      );
      expect(communes).toEqual(['Toutes', 'Bambey', 'Diourbel']);
      expect(ecoles).toEqual(['Toutes', 'École de test']);
    });

    it('relie chaque contrôle de filtre à une étiquette', () => {
      monter();

      for (const id of [
        'f-recherche',
        'f-etape',
        'f-commune',
        'f-ecole',
        'f-classe',
        'f-retard',
        'f-tri',
      ]) {
        expect(page().querySelector(`label[for="${id}"]`)).not.toBeNull();
      }
    });
  });

  describe('états', () => {
    it('affiche l’état vide sans filtre', () => {
      monter(unePage([]));

      expect(page().querySelector('.empty-state')?.textContent).toContain('Aucun dossier trouvé');
      expect(page().querySelector('table')).toBeNull();
    });

    it('explique que les filtres ne donnent rien quand ils sont actifs', () => {
      monter();
      choisir('f-etape', 'TRANSCRIT');
      repondre(unePage([]));

      expect(page().querySelector('.empty-state')?.textContent).toContain(
        'Aucun dossier ne correspond aux filtres',
      );
    });

    it('affiche le chargement tant que la réponse n’est pas arrivée', () => {
      TestBed.configureTestingModule({
        imports: [ListeDossiers],
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      });
      controleur = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(ListeDossiers);
      fixture.detectChanges();

      expect(page().querySelector('.message-info')?.textContent).toContain('Chargement');

      controleur.expectOne('/api/referentiels/communes').flush([]);
      controleur.expectOne('/api/referentiels/ecoles').flush([]);
      repondre(unePage([]));
    });

    it('affiche une erreur serveur et relance l’appel avec « Réessayer »', () => {
      monter();
      bouton('Actualiser').click();
      controleur.expectOne(estListe).flush(null, { status: 500, statusText: 'Erreur' });
      fixture.detectChanges();

      expect(page().querySelector('.message-error')?.textContent).toContain(
        'Impossible de charger les dossiers',
      );
      expect(page().querySelector('table')).toBeNull();

      bouton('Réessayer').click();
      repondre(unePage([unDossier(1)]));

      expect(page().querySelector('.message-error')).toBeNull();
      expect(lignes().length).toBe(1);
    });

    it('dit « Serveur injoignable » quand le serveur ne répond pas', () => {
      monter();
      bouton('Actualiser').click();
      controleur.expectOne(estListe).error(new ProgressEvent('error'));
      fixture.detectChanges();

      expect(page().querySelector('.message-error')?.textContent).toContain('Serveur injoignable');
    });

    it('explique un 403 par le rôle', () => {
      monter();
      bouton('Actualiser').click();
      controleur.expectOne(estListe).flush(null, { status: 403, statusText: 'Forbidden' });
      fixture.detectChanges();

      expect(page().querySelector('.message-error')?.textContent).toContain('Votre rôle');
    });

    it('ne journalise ni l’erreur ni les données dans la console', () => {
      const erreur = vi.spyOn(console, 'error');
      const journal = vi.spyOn(console, 'log');
      monter();
      bouton('Actualiser').click();
      controleur.expectOne(estListe).flush(null, { status: 500, statusText: 'Erreur' });

      expect(erreur).not.toHaveBeenCalled();
      expect(journal).not.toHaveBeenCalled();
    });
  });

  describe('pagination', () => {
    it('n’affiche pas la pagination quand tout tient sur une page', () => {
      monter(unePage([unDossier(1)], { totalPages: 1 }));

      expect(page().querySelector('.pagination')).toBeNull();
    });

    it('passe à la page suivante puis revient, en demandant la bonne page', () => {
      monter(unePage([unDossier(1)], { total: 25, totalPages: 2 }));
      expect(page().querySelector('.pagination')?.textContent).toContain('Page 1 sur 2');
      expect(bouton('Précédent').disabled).toBe(true);

      bouton('Suivant').click();
      const suivante = repondre(unePage([unDossier(21)], { page: 1, total: 25, totalPages: 2 }));

      expect(suivante['page']).toBe('1');
      expect(page().querySelector('.pagination')?.textContent).toContain('Page 2 sur 2');
      expect(bouton('Suivant').disabled).toBe(true);
      expect(bouton('Précédent').disabled).toBe(false);

      bouton('Précédent').click();
      const retour = repondre(unePage([unDossier(1)], { total: 25, totalPages: 2 }));

      expect(retour['page']).toBe('0');
    });

    it('revient à la première page quand un filtre change', () => {
      monter(unePage([unDossier(1)], { total: 25, totalPages: 2 }));
      bouton('Suivant').click();
      repondre(unePage([unDossier(21)], { page: 1, total: 25, totalPages: 2 }));

      choisir('f-classe', 'CM2');
      const envoyes = repondre(unePage([unDossier(1)]));

      expect(envoyes['page']).toBe('0');
      expect(envoyes['classe']).toBe('CM2');
    });
  });

  describe('filtres', () => {
    it('envoie l’étape, la commune, l’école et la classe choisies', () => {
      monter();

      choisir('f-etape', 'JUGEMENT_RENDU');
      expect(repondre(unePage([]))['etape']).toBe('JUGEMENT_RENDU');

      choisir('f-commune', '2');
      expect(repondre(unePage([]))['communeId']).toBe('2');

      choisir('f-ecole', '7');
      expect(repondre(unePage([]))['ecoleId']).toBe('7');

      choisir('f-classe', 'CE1');
      const tous = repondre(unePage([]));
      expect(tous).toMatchObject({
        etape: 'JUGEMENT_RENDU',
        communeId: '2',
        ecoleId: '7',
        classe: 'CE1',
      });
    });

    it('retire un filtre quand on revient à « Toutes »', () => {
      monter();
      choisir('f-etape', 'TRANSCRIT');
      repondre(unePage([]));

      choisir('f-etape', '');
      const envoyes = repondre(unePage([unDossier(1)]));

      expect(envoyes).not.toHaveProperty('etape');
    });

    it('distingue les trois états du retard : tous, en retard, pas en retard', () => {
      const initial = monter();
      expect(initial).not.toHaveProperty('enRetard');

      choisir('f-retard', 'oui');
      expect(repondre(unePage([]))['enRetard']).toBe('true');

      choisir('f-retard', 'non');
      expect(repondre(unePage([]))['enRetard']).toBe('false');

      choisir('f-retard', 'tous');
      expect(repondre(unePage([unDossier(1)]))).not.toHaveProperty('enRetard');
    });

    it('envoie le tri choisi dans la liste fermée du contrat', () => {
      monter();

      choisir('f-tri', 'reference,asc');

      expect(repondre(unePage([]))['tri']).toBe('reference,asc');
    });

    it('propose exactement les six tris du contrat', () => {
      monter();

      const valeurs = Array.from(page().querySelectorAll('#f-tri option')).map(
        (o) => (o as HTMLOptionElement).value,
      );
      expect(valeurs).toEqual([
        'dateDetection,desc',
        'dateDetection,asc',
        'dateJugement,desc',
        'dateJugement,asc',
        'reference,asc',
        'reference,desc',
      ]);
    });
  });

  describe('recherche', () => {
    beforeEach(() => vi.useFakeTimers());

    it('attend 300 ms après la dernière frappe et envoie une seule requête', () => {
      monter();

      saisir('a');
      saisir('aw');
      saisir('awa');
      vi.advanceTimersByTime(299);
      controleur.expectNone(estListe);

      vi.advanceTimersByTime(1);
      const envoyes = repondre(unePage([unDossier(1)]));

      expect(envoyes['q']).toBe('awa');
      expect(envoyes['page']).toBe('0');
    });

    it('ne rappelle pas le serveur pour une saisie qui ne change que les espaces', () => {
      monter();
      saisir('awa');
      vi.advanceTimersByTime(300);
      repondre(unePage([unDossier(1)]));

      saisir('awa  ');
      vi.advanceTimersByTime(300);

      controleur.expectNone(estListe);
    });
  });

  describe('réinitialisation', () => {
    beforeEach(() => vi.useFakeTimers());

    it('efface les filtres, la recherche et les champs, puis recharge', () => {
      monter();
      choisir('f-etape', 'TRANSCRIT');
      repondre(unePage([]));
      choisir('f-retard', 'oui');
      repondre(unePage([]));
      saisir('awa');
      vi.advanceTimersByTime(300);
      repondre(unePage([]));

      bouton('Réinitialiser').click();
      const envoyes = repondre(unePage([unDossier(1)]));

      expect(envoyes).toEqual({ page: '0', taille: '20', tri: 'dateDetection,desc' });
      expect((page().querySelector('#f-etape') as HTMLSelectElement).value).toBe('');
      expect((page().querySelector('#f-retard') as HTMLSelectElement).value).toBe('tous');
      expect((page().querySelector('#f-recherche') as HTMLInputElement).value).toBe('');
    });

    it('ne laisse pas se réappliquer une saisie encore en attente d’anti-rebond', () => {
      monter();

      saisir('abc');
      bouton('Réinitialiser').click();
      const envoyes = repondre(unePage([unDossier(1)]));
      expect(envoyes).not.toHaveProperty('q');

      vi.advanceTimersByTime(1000);

      controleur.expectNone(estListe);
    });
  });
});
