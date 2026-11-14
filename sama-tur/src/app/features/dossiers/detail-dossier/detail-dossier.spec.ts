import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { DossierDetail, ETAPES, StatutDossier } from '../../../core/models/dossier.model';
import { Role } from '../../../core/models/utilisateur.model';
import { TokenStorage } from '../../../core/services/token-storage';
import { unDossierDetail } from '../../../core/testing/dossier-test';
import { uneReponseConnexion } from '../../../core/testing/session-test';
import { DetailDossier } from './detail-dossier';

describe('DetailDossier', () => {
  let fixture: ComponentFixture<DetailDossier>;
  let controleur: HttpTestingController;

  const page = () => fixture.nativeElement as HTMLElement;
  const texte = (selecteur: string) => page().querySelector(selecteur)?.textContent?.trim() ?? null;
  /** Titres des blocs de données (le panneau d'avancement a le sien, testé à part). */
  const titres = () =>
    Array.from(page().querySelectorAll('section.detail-card h3')).map((h) => h.textContent?.trim());

  /** Monte la fiche pour `role` ; `id` simule le paramètre de l'URL. Ne répond à aucune requête. */
  function monter(role: Role = 'SUPERVISEUR', id = '12'): void {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [DetailDossier],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    });
    TestBed.inject(TokenStorage).enregistrer(uneReponseConnexion(role));
    controleur = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetailDossier);
    fixture.detectChanges();
  }

  /** Monte la fiche et répond par `dossier`. */
  function afficher(dossier: DossierDetail, role: Role = 'SUPERVISEUR'): void {
    monter(role);
    controleur.expectOne('/api/dossiers/12').flush(dossier);
    fixture.detectChanges();
  }

  afterEach(() => {
    controleur.verify();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('chargement', () => {
    it('lit le dossier en une seule requête, sans route d’historique', () => {
      monter();

      const requete = controleur.expectOne('/api/dossiers/12');
      expect(requete.request.method).toBe('GET');
      controleur.expectNone((r) => r.url.includes('/historique'));
      requete.flush(unDossierDetail('DETECTE'));
    });

    it('affiche le chargement tant que la réponse n’est pas arrivée', () => {
      monter();

      expect(texte('.message-info')).toContain('Chargement du dossier');

      controleur.expectOne('/api/dossiers/12').flush(unDossierDetail('DETECTE'));
      fixture.detectChanges();

      expect(page().querySelector('.message-info')).toBeNull();
    });

    it('refuse un identifiant invalide sans interroger le serveur', () => {
      monter('SUPERVISEUR', 'abc');

      controleur.expectNone('/api/dossiers/NaN');
      expect(texte('.message-error')).toContain('Identifiant du dossier invalide');
      expect(page().querySelector('button')).toBeNull();
    });

    it.each([
      [404, 'introuvable'],
      [403, 'Votre rôle ne permet pas'],
      [500, 'Impossible de charger'],
    ])('%i : message clair', (statut, extrait) => {
      monter();
      controleur
        .expectOne('/api/dossiers/12')
        .flush(null, { status: statut, statusText: 'Erreur' });
      fixture.detectChanges();

      expect(texte('.message-error')).toContain(extrait);
      expect(page().querySelector('.details-container')).toBeNull();
    });

    it('serveur injoignable : le dit, et propose de réessayer', () => {
      monter();
      controleur.expectOne('/api/dossiers/12').error(new ProgressEvent('error'));
      fixture.detectChanges();

      expect(texte('.message-error')).toContain('Serveur injoignable');

      (page().querySelector('.message-error button') as HTMLButtonElement).click();
      controleur.expectOne('/api/dossiers/12').flush(unDossierDetail('DETECTE'));
      fixture.detectChanges();

      expect(page().querySelector('.message-error')).toBeNull();
      expect(texte('.summary-card h2')).toBe('ST-2026-000012');
    });

    it('ne journalise rien dans la console', () => {
      const erreur = vi.spyOn(console, 'error');
      const journal = vi.spyOn(console, 'log');

      monter();
      controleur.expectOne('/api/dossiers/12').flush(null, { status: 500, statusText: 'Erreur' });

      expect(erreur).not.toHaveBeenCalled();
      expect(journal).not.toHaveBeenCalled();
    });
  });

  describe('en-tête et élève', () => {
    it('affiche la référence, l’étape en français et la frise des six étapes', () => {
      afficher(unDossierDetail('JUGEMENT_RENDU'));

      expect(texte('.summary-card h2')).toBe('ST-2026-000012');
      expect(texte('.status-badge')).toBe('Jugement rendu');
      expect(page().querySelectorAll('app-frise-etapes li').length).toBe(6);
      expect(page().querySelector('app-frise-etapes [aria-current="step"]')?.textContent).toContain(
        'Jugement rendu',
      );
    });

    it('signale un dossier en retard et les jours depuis le jugement', () => {
      afficher(unDossierDetail('JUGEMENT_RENDU', { enRetard: true, joursDepuisJugement: 42 }));

      expect(texte('.badge-retard')).toContain('En retard');
      expect(texte('.badge-retard')).toContain('42 jours depuis le jugement');
    });

    it('n’affiche pas de badge de retard pour un dossier à l’heure', () => {
      afficher(unDossierDetail('JUGEMENT_RENDU', { enRetard: false, joursDepuisJugement: 5 }));

      expect(page().querySelector('.badge-retard')).toBeNull();
    });

    it('affiche l’élève à plat, en français', () => {
      afficher(unDossierDetail('DETECTE'));

      const eleve = page().querySelector('.detail-card')?.textContent ?? '';
      expect(eleve).toContain('Test');
      expect(eleve).toContain('Awa');
      expect(eleve).toContain('Féminin');
      expect(eleve).toContain('02/03/2015');
      expect(eleve).toContain('Bambey');
      expect(eleve).toContain('CM2');
      expect(eleve).toContain('École de test');
      expect(eleve).toContain('Mère Test');
      expect(eleve).not.toContain('Père');
    });

    it('précise une date de naissance présumée', () => {
      const dossier = unDossierDetail('DETECTE');
      dossier.eleve.dateNaissancePresumee = true;
      afficher(dossier);

      expect(page().textContent).toContain('02/03/2015 (présumée)');
    });
  });

  describe('un bloc par étape franchie', () => {
    const attendus: Record<StatutDossier, string[]> = {
      DETECTE: ["Informations de l'élève", 'Détection'],
      CERTIFICAT_OBTENU: ['Certificat de naissance'],
      DOSSIER_COMPLET: ['Preuve de naissance'],
      JUGEMENT_RENDU: ['Jugement'],
      TRANSCRIT: ["Transcription de l'acte"],
      ACTE_REMIS: ["Remise de l'acte"],
    };

    it.each(ETAPES)('à l’étape %s, seuls les blocs des étapes franchies sont affichés', (etape) => {
      afficher(unDossierDetail(etape));

      const rang = ETAPES.indexOf(etape);
      const attendu = ETAPES.slice(0, rang + 1).flatMap((e) => attendus[e]);

      expect(titres()).toEqual([...attendu, 'Historique des opérations']);
    });

    it('montre toutes les données d’un dossier à ACTE_REMIS (scénario S3)', () => {
      afficher(unDossierDetail('ACTE_REMIS'));

      const contenu = page().textContent ?? '';
      for (const valeur of [
        '01/09/2026', // détection
        'CERT-001',
        '10/09/2026',
        'Centre de test',
        'Deux témoins',
        'Témoin Un',
        'pièce n° P-2',
        'JUG-001',
        '20/09/2026',
        'Tribunal de test',
        'Ordinaire',
        'ACTE-001',
        '2026',
        '01/10/2026',
        '10/10/2026',
      ]) {
        expect(contenu).toContain(valeur);
      }
      expect(page().querySelectorAll('.temoins li').length).toBe(2);
    });

    it('n’affiche pas la liste des témoins pour un certificat d’accouchement', () => {
      afficher(
        unDossierDetail('DOSSIER_COMPLET', {
          preuveNaissance: 'CERTIFICAT_ACCOUCHEMENT',
          temoins: [],
        }),
      );

      expect(page().textContent).toContain('Certificat d’accouchement');
      expect(page().querySelector('.temoins')).toBeNull();
    });
  });

  describe('historique', () => {
    it('liste les opérations du plus ancien au plus récent, avec date et heure', () => {
      afficher(
        unDossierDetail('CERTIFICAT_OBTENU', {
          historique: [
            {
              etapeDepart: null,
              etapeArrivee: 'DETECTE',
              dateHeure: '2026-09-01T08:05:00',
              auteur: 'Première Personne',
              role: 'ECOLE',
              commentaire: null,
            },
            {
              etapeDepart: 'DETECTE',
              etapeArrivee: 'CERTIFICAT_OBTENU',
              dateHeure: '2026-09-10T14:30:00.123456',
              auteur: 'Seconde Personne',
              role: 'ETAT_CIVIL',
              commentaire: 'Certificat reçu',
            },
          ],
        }),
      );

      const lignes = Array.from(page().querySelectorAll('.history-item'));
      expect(lignes.length).toBe(2);
      expect(lignes[0].textContent).toContain('Création');
      expect(lignes[0].textContent).toContain('Détecté');
      expect(lignes[0].textContent).toContain('01/09/2026 08:05');
      expect(lignes[0].textContent).toContain('Première Personne');
      expect(lignes[0].textContent).toContain('École');
      expect(lignes[0].querySelector('.history-comment')).toBeNull();

      expect(lignes[1].textContent).toContain('Détecté');
      expect(lignes[1].textContent).toContain('Certificat obtenu');
      expect(lignes[1].textContent).toContain('10/09/2026 14:30');
      expect(lignes[1].textContent).toContain('État civil');
      expect(lignes[1].textContent).toContain('Certificat reçu');
    });

    it('affiche un tiret pour un auteur absent et garde un rôle inconnu tel quel', () => {
      afficher(
        unDossierDetail('DETECTE', {
          historique: [
            {
              etapeDepart: null,
              etapeArrivee: 'DETECTE',
              dateHeure: '2026-09-01T08:00:00',
              auteur: null,
              role: 'IMPORT',
              commentaire: null,
            },
          ],
        }),
      );

      const meta = texte('.history-meta') ?? '';
      expect(meta).toContain('Auteur : —');
      expect(meta).toContain('Rôle : IMPORT');
    });

    it('dit quand il n’y a aucun historique', () => {
      afficher(unDossierDetail('DETECTE', { historique: [] }));

      expect(texte('.empty-history')).toContain('Aucun historique');
    });
  });

  describe('avancement', () => {
    it('affiche le panneau d’avancement pour le rôle exigé, pas pour les autres', () => {
      afficher(unDossierDetail('TRANSCRIT'), 'ECOLE');

      expect(page().querySelector('app-avancement-dossier form')).not.toBeNull();
    });

    it('n’affiche que le message de lecture au superviseur', () => {
      afficher(unDossierDetail('TRANSCRIT'), 'SUPERVISEUR');

      expect(page().querySelector('app-avancement-dossier form')).toBeNull();
      expect(texte('app-avancement-dossier .lecture')).toContain('à saisir par École');
    });

    it('remplace le dossier affiché par la réponse du backend après un avancement', () => {
      afficher(unDossierDetail('TRANSCRIT'), 'ECOLE');
      expect(page().querySelectorAll('.history-item').length).toBe(5);

      const champ = page().querySelector('#av-dateRemise') as HTMLInputElement;
      champ.value = '2026-10-10';
      champ.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      (page().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      controleur.expectOne('/api/dossiers/12/avancer').flush(unDossierDetail('ACTE_REMIS'));
      fixture.detectChanges();

      expect(texte('.status-badge')).toBe('Acte remis');
      expect(titres()).toContain("Remise de l'acte");
      expect(page().querySelectorAll('.history-item').length).toBe(6);
      expect(texte('app-avancement-dossier .confirmation')).toContain('Acte remis');
      expect(texte('app-avancement-dossier .lecture')).toContain('Dossier terminé');
    });

    it('recharge la fiche sur un 409 et garde le message du conflit', () => {
      afficher(unDossierDetail('TRANSCRIT'), 'ECOLE');
      const champ = page().querySelector('#av-dateRemise') as HTMLInputElement;
      champ.value = '2026-10-10';
      champ.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      (page().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      controleur
        .expectOne('/api/dossiers/12/avancer')
        .flush({ detail: 'Étape déjà franchie.' }, { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      const rechargement = controleur.expectOne('/api/dossiers/12');
      expect(rechargement.request.method).toBe('GET');
      rechargement.flush(unDossierDetail('ACTE_REMIS'));
      fixture.detectChanges();

      expect(texte('.status-badge')).toBe('Acte remis');
      expect(texte('app-avancement-dossier .bandeau-erreur')).toContain(
        'Ce dossier a déjà été modifié',
      );
    });
  });
});
