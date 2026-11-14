import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { DossierResume, ETAPES } from '../../../core/models/dossier.model';
import { Indicateurs } from '../../../core/models/indicateurs.model';
import { Page } from '../../../core/models/page.model';
import { Role } from '../../../core/models/utilisateur.model';
import { TokenStorage } from '../../../core/services/token-storage';
import { uneReponseConnexion } from '../../../core/testing/session-test';
import { Dashboard } from './dashboard';

registerLocaleData(localeFr);

const INDICATEURS: Indicateurs = {
  communeId: null,
  dateReference: '2026-11-14',
  delaiCibleJours: 15,
  i1PartTranscritsDansDelaiCible: 0.5454545454545454,
  i2DelaiMedianJours: 75,
  i3ElevesClasseExamenSansActe: 26,
  dossiersParEtape: {
    DETECTE: 7,
    CERTIFICAT_OBTENU: 7,
    DOSSIER_COMPLET: 6,
    JUGEMENT_RENDU: 9,
    TRANSCRIT: 6,
    ACTE_REMIS: 5,
  },
  dossiersEnRetard: 5,
  totalDossiers: 40,
};

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

function unePage(contenu: DossierResume[]): Page<DossierResume> {
  return { contenu, page: 0, taille: 5, totalElements: contenu.length, totalPages: 1 };
}

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let controleur: HttpTestingController;

  const estIndicateurs = (r: { url: string }) => r.url === '/api/indicateurs';
  const estListe = (r: { url: string }) => r.url === '/api/dossiers';
  const page = () => fixture.nativeElement as HTMLElement;
  const texte = (selecteur: string) => page().querySelector(selecteur)?.textContent?.trim() ?? null;
  const valeur = (carte: string) => texte(`#${carte} .stat-value`);

  function parametres(requete: TestRequest): Record<string, string> {
    const envoyes: Record<string, string> = {};
    for (const cle of requete.request.params.keys()) {
      envoyes[cle] = requete.request.params.get(cle) as string;
    }
    return envoyes;
  }

  /** Monte le tableau de bord pour `role`, sans répondre à aucune requête. */
  function monter(role: Role = 'SUPERVISEUR'): void {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'fr' },
      ],
    });
    TestBed.inject(TokenStorage).enregistrer(uneReponseConnexion(role));
    controleur = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  }

  /** Répond aux trois requêtes de démarrage. */
  function repondre(
    indicateurs: Indicateurs = INDICATEURS,
    recents: DossierResume[] = [unDossier(1), unDossier(2)],
  ): void {
    controleur.expectOne('/api/referentiels/communes').flush([
      { id: 3, nom: 'Bambey' },
      { id: 4, nom: 'Diourbel' },
    ]);
    controleur.expectOne(estIndicateurs).flush(indicateurs);
    controleur.expectOne(estListe).flush(unePage(recents));
    fixture.detectChanges();
  }

  function afficher(role: Role = 'SUPERVISEUR', indicateurs: Indicateurs = INDICATEURS): void {
    monter(role);
    repondre(indicateurs);
  }

  afterEach(() => {
    controleur.verify();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('requêtes', () => {
    it('lit les chiffres en une seule requête, les cinq derniers dossiers et les communes', () => {
      monter();

      const indicateurs = controleur.expectOne(estIndicateurs);
      const liste = controleur.expectOne(estListe);
      expect(parametres(indicateurs)).toEqual({});
      expect(parametres(liste)).toEqual({ page: '0', taille: '5' });
      controleur.expectOne('/api/referentiels/communes');
      indicateurs.flush(INDICATEURS);
      liste.flush(unePage([]));
      controleur.match('/api/referentiels/communes').forEach((r) => r.flush([]));
    });

    it('ne compte plus rien par liste complète : aucun appel aux élèves ni aux alertes', () => {
      monter('ECOLE');

      controleur.expectNone((r) => r.url.startsWith('/api/eleves'));
      controleur.expectNone((r) => r.url.startsWith('/api/alertes'));
      repondre();
    });

    it('relance les deux lectures avec « Actualiser »', () => {
      afficher();

      (page().querySelector('.refresh-button') as HTMLButtonElement).click();

      controleur.expectOne(estIndicateurs).flush(INDICATEURS);
      controleur.expectOne(estListe).flush(unePage([]));
      fixture.detectChanges();
      expect(page().textContent).toContain('Aucun dossier disponible');
    });
  });

  describe('chiffres', () => {
    it('affiche I1 en pourcentage à une décimale, I2 en jours, I3, retards et total', () => {
      afficher();

      expect(valeur('i1')).toBe('54,5 %');
      expect(valeur('i2')).toBe('75 jours');
      expect(valeur('i3')).toBe('26');
      expect(valeur('retard')).toBe('5');
      expect(valeur('total')).toBe('40');
    });

    it('rappelle le délai cible à côté des retards et de I1', () => {
      afficher();

      expect(texte('#retard .stat-hint')).toContain('15 jours');
      expect(texte('#i1 .stat-hint')).toContain('15 jours');
    });

    it('écrit une décimale française pour un délai médian non entier', () => {
      afficher('SUPERVISEUR', { ...INDICATEURS, i2DelaiMedianJours: 37.5 });

      expect(valeur('i2')).toBe('37,5 jours');
    });

    it('affiche « — » et « Pas encore de donnée » quand I1 et I2 sont null', () => {
      afficher('SUPERVISEUR', {
        ...INDICATEURS,
        i1PartTranscritsDansDelaiCible: null,
        i2DelaiMedianJours: null,
        i3ElevesClasseExamenSansActe: 0,
      });

      expect(valeur('i1')).toBe('—');
      expect(valeur('i2')).toBe('—');
      expect(texte('#i1 .stat-hint')).toBe('Pas encore de donnée');
      expect(texte('#i2 .stat-hint')).toBe('Pas encore de donnée');
      expect(valeur('i3')).toBe('0');
      expect(page().textContent).not.toContain('NaN');
      expect(page().textContent).not.toContain('null');
    });

    it('affiche « — » partout tant que les chiffres ne sont pas arrivés', () => {
      monter();

      for (const carte of ['i1', 'i2', 'i3', 'retard', 'total']) {
        expect(valeur(carte)).toBe('—');
      }
      repondre();
    });

    it('conserve I1 à 0 % : zéro est une vraie valeur, pas une absence', () => {
      afficher('SUPERVISEUR', { ...INDICATEURS, i1PartTranscritsDansDelaiCible: 0 });

      expect(valeur('i1')).toBe('0,0 %');
    });
  });

  describe('répartition par étape', () => {
    const ligne = () =>
      Array.from(page().querySelectorAll('.repartition-ligne')).map((l) => [
        l.querySelector('.repartition-etape')?.textContent?.trim(),
        l.querySelector('.repartition-nombre')?.textContent?.trim(),
      ]);

    it('montre les six étapes dans l’ordre, avec leur nombre', () => {
      afficher();

      expect(ligne()).toEqual([
        ['Détecté', '7'],
        ['Certificat obtenu', '7'],
        ['Dossier complet', '6'],
        ['Jugement rendu', '9'],
        ['Transcrit', '6'],
        ['Acte remis', '5'],
      ]);
    });

    it('montre toujours six étapes, même à zéro ou absentes de la réponse', () => {
      afficher('SUPERVISEUR', {
        ...INDICATEURS,
        totalDossiers: 0,
        dossiersEnRetard: 0,
        dossiersParEtape: { DETECTE: 0 } as Indicateurs['dossiersParEtape'],
      });

      expect(ligne().length).toBe(ETAPES.length);
      expect(ligne().every(([, nombre]) => nombre === '0')).toBe(true);
      const largeurs = Array.from(page().querySelectorAll('.barre-remplie')).map(
        (b) => (b as HTMLElement).style.width,
      );
      expect(largeurs.every((l) => l === '0%')).toBe(true);
    });

    it('proportionne la barre au total des dossiers', () => {
      afficher();

      const barres = Array.from(page().querySelectorAll('.barre-remplie')) as HTMLElement[];
      expect(barres[3].style.width).toBe('22.5%');
    });
  });

  describe('filtre par commune', () => {
    it('relance seulement les chiffres avec communeId, puis sans quand on revient à « Toutes »', () => {
      afficher();
      const select = page().querySelector('#filtre-commune') as HTMLSelectElement;

      select.value = '3';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      const filtre = controleur.expectOne(estIndicateurs);
      expect(parametres(filtre)).toEqual({ communeId: '3' });
      filtre.flush({ ...INDICATEURS, communeId: 3, totalDossiers: 9, dossiersEnRetard: 1 });
      fixture.detectChanges();
      controleur.expectNone(estListe);
      expect(valeur('total')).toBe('9');

      select.value = '';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(parametres(controleur.expectOne(estIndicateurs))).toEqual({});
    });

    it('propose les communes du référentiel', () => {
      afficher();

      const options = Array.from(page().querySelectorAll('#filtre-commune option')).map((o) =>
        o.textContent?.trim(),
      );
      expect(options).toEqual(['Toutes les communes', 'Bambey', 'Diourbel']);
    });
  });

  describe('en-tête', () => {
    it('affiche le nom, le rôle et la structure de l’utilisateur', () => {
      afficher('ETAT_CIVIL');

      const entete = texte('.user-details') ?? '';
      expect(entete).toContain('Utilisateur de test');
      expect(entete).toContain('État civil');
      expect(entete).toContain('Structure de test');
    });

    it('n’affiche pas de structure pour le superviseur', () => {
      afficher('SUPERVISEUR');

      expect(page().querySelectorAll('.user-details small').length).toBe(1);
      expect(texte('.user-details')).toContain('Superviseur');
    });

    it('ne connaît pas de rôle d’administration', () => {
      afficher('ECOLE');

      expect(texte('.user-details')).not.toContain('Administrateur');
    });
  });

  describe('raccourcis par rôle', () => {
    const liens = () =>
      Array.from(page().querySelectorAll('a.quick-card')).map((a) => a.getAttribute('href'));

    it.each([
      ['ECOLE', ['/dossiers', '/eleves/import']],
      ['ETAT_CIVIL', ['/dossiers', '/alertes']],
      ['TRIBUNAL', ['/dossiers', '/alertes']],
      ['SUPERVISEUR', ['/dossiers', '/alertes']],
    ] as const)('%s : %j', (role, attendus) => {
      afficher(role);

      expect(liens()).toEqual([...attendus]);
    });

    it('ne propose ni création de dossier ni écran d’élèves non aligné', () => {
      afficher('ECOLE');

      expect(page().innerHTML).not.toContain('/dossiers/nouveau');
      expect(page().innerHTML).not.toContain('href="/eleves"');
      expect(page().innerHTML).not.toContain('/eleves/nouveau');
    });

    it('ne renvoie vers les alertes que les rôles qui y ont accès, aussi depuis la carte des retards', () => {
      afficher('ECOLE');
      expect(page().querySelector('#retard a')).toBeNull();
    });

    it('renvoie vers les alertes depuis la carte des retards pour l’état civil', () => {
      afficher('ETAT_CIVIL');
      expect(page().querySelector('#retard a')?.getAttribute('href')).toBe('/alertes');
    });
  });

  describe('derniers dossiers', () => {
    it('liste les dossiers reçus avec leur étape, leur date et un lien vers la fiche', () => {
      afficher('SUPERVISEUR');

      const rangs = Array.from(page().querySelectorAll('.recent-section tbody tr'));
      expect(rangs.length).toBe(2);
      expect(rangs[0].textContent).toContain('ST-2026-000001');
      expect(rangs[0].textContent).toContain('Détecté');
      expect(rangs[0].textContent).toContain('05/10/2026');
      expect(rangs[0].querySelector('a')?.getAttribute('href')).toBe('/dossiers/1');
    });

    it('signale un dossier en retard', () => {
      monter();
      repondre(INDICATEURS, [unDossier(1, { enRetard: true, etape: 'JUGEMENT_RENDU' })]);

      expect(page().querySelector('.recent-section .badge-retard')?.textContent).toContain(
        'En retard',
      );
    });

    it('dit quand il n’y a aucun dossier', () => {
      monter();
      repondre(INDICATEURS, []);

      expect(page().querySelector('.recent-section')?.textContent).toContain(
        'Aucun dossier disponible',
      );
    });
  });

  describe('erreurs', () => {
    it('signale l’échec des chiffres sans inventer de valeur', () => {
      monter();
      controleur.expectOne('/api/referentiels/communes').flush([]);
      controleur.expectOne(estIndicateurs).flush(null, { status: 500, statusText: 'Erreur' });
      controleur.expectOne(estListe).flush(unePage([unDossier(1)]));
      fixture.detectChanges();

      expect(texte('.error-banner')).toContain("Certaines données n'ont pas pu être chargées");
      expect(valeur('total')).toBe('—');
      expect(page().querySelectorAll('.recent-section tbody tr').length).toBe(1);
    });

    it('signale l’échec des derniers dossiers sans perdre les chiffres', () => {
      monter();
      controleur.expectOne('/api/referentiels/communes').flush([]);
      controleur.expectOne(estIndicateurs).flush(INDICATEURS);
      controleur.expectOne(estListe).flush(null, { status: 500, statusText: 'Erreur' });
      fixture.detectChanges();

      expect(texte('.error-banner')).not.toBeNull();
      expect(valeur('total')).toBe('40');
    });

    it('ne journalise ni les données ni les erreurs dans la console', () => {
      const journal = vi.spyOn(console, 'log');
      const erreur = vi.spyOn(console, 'error');

      monter();
      controleur.expectOne('/api/referentiels/communes').flush([]);
      controleur.expectOne(estIndicateurs).flush(null, { status: 500, statusText: 'Erreur' });
      controleur.expectOne(estListe).flush(unePage([unDossier(1)]));

      expect(journal).not.toHaveBeenCalled();
      expect(erreur).not.toHaveBeenCalled();
    });
  });

  describe('déconnexion', () => {
    it('efface la session et renvoie vers la connexion', () => {
      afficher('TRIBUNAL');
      const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      (page().querySelector('.logout-button') as HTMLButtonElement).click();

      expect(TestBed.inject(TokenStorage).getToken()).toBeNull();
      expect(navigation).toHaveBeenCalledWith(['/login']);
    });
  });
});
