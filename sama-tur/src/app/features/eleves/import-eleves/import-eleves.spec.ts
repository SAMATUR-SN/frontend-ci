import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RapportImport } from '../../../core/models/rapport-import.model';
import { COLONNES_MODELE, modeleCsv } from '../../../core/utils/csv-import';
import { ImportEleves } from './import-eleves';

const ENTETE = COLONNES_MODELE.join(';');
const AWA =
  'Awa;Diouf;F;14/03/2014;non;Bambey;ECO-BAM-01;CM2;Mariama Sene;Ibrahima Diouf;+221770000099;WOLOF;';
const MOUSSA = 'Moussa;Ndiaye;M;02/07/2014;oui;Bambeye;ECO-BAM-01;CM2;Fatou Sarr;;;;';
const EXEMPLE_BACKEND = `${ENTETE}\n${AWA}\n${MOUSSA}\n`;

const RAPPORT_PARTIEL: RapportImport = {
  total: 2,
  importes: 1,
  rejetes: 1,
  erreurs: [{ ligne: 3, motif: 'commune inconnue : Bambeye' }],
};

describe('ImportEleves', () => {
  let fixture: ComponentFixture<ImportEleves>;
  let controleur: HttpTestingController;

  const page = () => fixture.nativeElement as HTMLElement;
  const texte = (selecteur: string) => page().querySelector(selecteur)?.textContent?.trim() ?? null;
  const importer = () => page().querySelector('.import-button') as HTMLButtonElement;
  const erreurFichier = () => texte('.upload-card .message.error');

  function monter(): void {
    TestBed.configureTestingModule({
      imports: [ImportEleves],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controleur = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ImportEleves);
    fixture.detectChanges();
  }

  /** Choisit `fichier` dans le champ, comme le ferait le sélecteur de fichiers du navigateur. */
  async function choisir(fichier: File): Promise<void> {
    const champ = page().querySelector('#csvFile') as HTMLInputElement;
    Object.defineProperty(champ, 'files', { value: [fichier], configurable: true });
    champ.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        page().querySelector('.file-selected') ??
          page().querySelector('.upload-card .message.error'),
      ).not.toBeNull();
    });
  }

  const csv = (contenu: string, nom = 'eleves.csv') =>
    new File([contenu], nom, { type: 'text/csv' });

  /** Choisit un fichier valable et lance l'import ; rend la requête en attente. */
  async function lancerImport(contenu = EXEMPLE_BACKEND) {
    await choisir(csv(contenu));
    importer().click();
    fixture.detectChanges();
    return controleur.expectOne('/api/eleves/import');
  }

  beforeEach(() => monter());

  afterEach(() => {
    controleur.verify();
    vi.restoreAllMocks();
  });

  describe('choix du fichier', () => {
    it('affiche le fichier, ses lignes de données et une prévisualisation', async () => {
      await choisir(csv(EXEMPLE_BACKEND));

      expect(texte('.file-info strong')).toBe('eleves.csv');
      expect(texte('.file-info small')).toContain('2 lignes de données');
      const lignes = page().querySelectorAll('.preview-card tbody tr');
      expect(lignes.length).toBe(2);
      expect(page().querySelector('.preview-card thead')?.textContent).toContain('nom_mere');
      expect(lignes[0].textContent).toContain('Awa');
      expect(importer().disabled).toBe(false);
    });

    it('accorde « 1 ligne » au singulier', async () => {
      await choisir(csv(`${ENTETE}\n${AWA}\n`));

      expect(texte('.file-info small')).toBe('1 ligne de données détectée');
    });

    it('n’active pas l’import sans fichier', () => {
      expect(importer().disabled).toBe(true);
    });

    it('accepte un export Excel : BOM, fins de ligne Windows, colonnes en majuscules', async () => {
      await choisir(csv(`\uFEFF${ENTETE.toUpperCase()}\r\n${AWA}\r\n`));

      expect(page().querySelector('.file-selected')).not.toBeNull();
      expect(erreurFichier()).toBeNull();
    });

    it('permet de retirer le fichier choisi', async () => {
      await choisir(csv(EXEMPLE_BACKEND));

      (page().querySelector('.remove-button') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(page().querySelector('.file-selected')).toBeNull();
      expect(page().querySelector('.preview-card')).toBeNull();
      expect(importer().disabled).toBe(true);
    });
  });

  describe('refus avant envoi', () => {
    async function refuse(fichier: File, extrait: string): Promise<void> {
      await choisir(fichier);

      expect(erreurFichier()).toContain(extrait);
      expect(page().querySelector('.file-selected')).toBeNull();
      expect(importer().disabled).toBe(true);
      controleur.expectNone('/api/eleves/import');
    }

    it('refuse un fichier .txt', () => refuse(csv(EXEMPLE_BACKEND, 'eleves.txt'), 'fichier CSV'));

    it('refuse un fichier vide', () => refuse(csv('', 'vide.csv'), 'vide'));

    it('refuse un fichier de plus de 2 Mo', () =>
      refuse(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'gros.csv'), '2 Mo'));

    it('refuse un fichier sans nom_mere, et nomme la colonne', () =>
      refuse(csv(`${ENTETE.replace(';nom_mere', '')}\n${AWA}\n`), 'nom_mere'));

    it('refuse un fichier séparé par des virgules', () =>
      refuse(
        csv(`${ENTETE.replaceAll(';', ',')}\n${AWA.replaceAll(';', ',')}\n`),
        'point-virgule',
      ));

    it('refuse un fichier qui n’est pas en UTF-8 (Excel « CSV » simple)', () =>
      refuse(
        new File(
          [Uint8Array.from([...new TextEncoder().encode(`${ENTETE}\n`), 0x42, 0xe9, 0x3b])],
          'excel.csv',
        ),
        'UTF-8',
      ));

    it('refuse plus de 1 000 lignes de données', () =>
      refuse(
        csv([ENTETE, ...Array.from({ length: 1001 }, () => AWA)].join('\n')),
        '1 000 au maximum',
      ));

    it('refuse un en-tête sans aucune ligne de données', () =>
      refuse(csv(`${ENTETE}\n`), 'aucune ligne'));

    it('refuse le modèle téléchargé tant que sa ligne d’exemple n’est pas retirée', () =>
      refuse(csv(modeleCsv(), 'modele.csv'), 'ligne d’exemple'));

    it('efface le refus dès qu’un bon fichier est choisi', async () => {
      await choisir(csv('x', 'mauvais.txt'));
      expect(erreurFichier()).not.toBeNull();

      await choisir(csv(EXEMPLE_BACKEND));

      expect(erreurFichier()).toBeNull();
      expect(page().querySelector('.file-selected')).not.toBeNull();
    });
  });

  describe('résultat', () => {
    it('envoie le fichier, désactive le bouton pendant l’envoi et résume le rapport', async () => {
      const requete = await lancerImport();

      expect(requete.request.method).toBe('POST');
      expect((requete.request.body as FormData).get('file')).toBeInstanceOf(File);
      expect(importer().disabled).toBe(true);
      expect(importer().textContent).toContain('Importation en cours');

      requete.flush(RAPPORT_PARTIEL);
      fixture.detectChanges();

      expect(texte('.resume')).toBe('1 importé, 1 rejeté sur 2 lignes');
      expect(importer().disabled).toBe(true);
    });

    it('affiche les rejets : numéro de ligne et motif', async () => {
      (await lancerImport()).flush(RAPPORT_PARTIEL);
      fixture.detectChanges();

      const lignes = Array.from(page().querySelectorAll('.rejets tbody tr')).map((tr) =>
        Array.from(tr.querySelectorAll('td')).map((td) => td.textContent?.trim()),
      );
      expect(lignes).toEqual([['3', 'commune inconnue : Bambeye']]);
      expect(page().querySelector('.rejets caption')?.textContent).toContain('rejetées');
    });

    it('retire le fichier et sa prévisualisation une fois importé', async () => {
      (await lancerImport()).flush(RAPPORT_PARTIEL);
      fixture.detectChanges();

      expect(page().querySelector('.file-selected')).toBeNull();
      expect(page().querySelector('.preview-card')).toBeNull();
    });

    it('un réimport : 0 importé, tout rejeté, signalé comme un avertissement et non comme un succès', async () => {
      (await lancerImport()).flush({
        total: 2,
        importes: 0,
        rejetes: 2,
        erreurs: [
          {
            ligne: 2,
            motif: 'doublon : un élève de même prénom, nom, date de naissance et école existe déjà',
          },
          { ligne: 3, motif: 'commune inconnue : Bambeye' },
        ],
      });
      fixture.detectChanges();

      expect(texte('.resume')).toBe('0 importé, 2 rejetés sur 2 lignes');
      expect(page().querySelector('.message.warning')).not.toBeNull();
      expect(page().querySelector('.message.success')).toBeNull();
      expect(page().querySelectorAll('.rejets tbody tr').length).toBe(2);
      expect(page().querySelector('.rejets')?.textContent).toContain('doublon');
    });

    it('un import sans rejet : succès, sans tableau', async () => {
      (await lancerImport(`${ENTETE}\n${AWA}\n`)).flush({
        total: 1,
        importes: 1,
        rejetes: 0,
        erreurs: [],
      });
      fixture.detectChanges();

      expect(texte('.resume')).toBe('1 importé, 0 rejeté sur 1 ligne');
      expect(page().querySelector('.message.success')).not.toBeNull();
      expect(page().querySelector('.rejets')).toBeNull();
    });

    it('propose « Nouvel import » et un lien vers la liste des dossiers', async () => {
      (await lancerImport()).flush(RAPPORT_PARTIEL);
      fixture.detectChanges();

      expect(page().querySelector('.actions-rapport a')?.getAttribute('href')).toBe('/dossiers');

      (page().querySelector('.btn-secondaire') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(page().querySelector('.resume')).toBeNull();
      expect(page().querySelector('.rejets')).toBeNull();
    });

    it('vide le champ fichier après un import : sans cela, rechoisir le même fichier ne ferait rien', async () => {
      const champ = page().querySelector('#csvFile') as HTMLInputElement;
      let valeur = '';
      Object.defineProperty(champ, 'value', {
        get: () => valeur,
        set: (v: string) => (valeur = v),
        configurable: true,
      });

      await choisir(csv(EXEMPLE_BACKEND));
      valeur = 'C:\\fakepath\\eleves.csv'; // ce que le navigateur garde dans le champ
      importer().click();
      controleur.expectOne('/api/eleves/import').flush(RAPPORT_PARTIEL);

      expect(valeur).toBe('');
    });

    it('n’envoie pas deux fois le même fichier si l’on clique plusieurs fois', async () => {
      await choisir(csv(EXEMPLE_BACKEND));

      importer().click();
      importer().click();

      controleur.expectOne('/api/eleves/import').flush(RAPPORT_PARTIEL);
    });
  });

  describe('refus du serveur', () => {
    async function refusServeur(statut: number, corps: object | null) {
      (await lancerImport()).flush(corps, { status: statut, statusText: 'Erreur' });
      fixture.detectChanges();
    }

    it.each([
      ['colonnes-manquantes', 'Colonnes obligatoires absentes de l’en-tête : nom_mere.'],
      [
        'encodage',
        'Le fichier n’est pas en UTF-8 : l’enregistrer depuis Excel au format « CSV UTF-8 ».',
      ],
      ['fichier-trop-long', 'Le fichier dépasse 1000 lignes d’élèves.'],
    ])('422 %s : affiche le détail du serveur', async (code, detail) => {
      await refusServeur(422, {
        type: `https://samatur.sn/erreurs/${code}`,
        title: 'Règle métier non respectée',
        status: 422,
        detail,
      });

      expect(texte('.message.error p')).toBe(detail);
      expect(page().querySelector('.resume')).toBeNull();
    });

    it('400 : affiche le détail du serveur', async () => {
      await refusServeur(400, { detail: 'Fichier CSV absent ou vide.' });

      expect(texte('.message.error p')).toBe('Fichier CSV absent ou vide.');
    });

    it('403 : « Réservé aux directeurs d’école. »', async () => {
      await refusServeur(403, { detail: 'Votre rôle ne permet pas cette action.' });

      expect(texte('.message.error p')).toBe('Réservé aux directeurs d’école.');
    });

    it('413 : fichier trop volumineux, en français, sans le message anglais du serveur', async () => {
      await refusServeur(413, {
        title: 'Content Too Large',
        detail: 'Maximum upload size exceeded',
      });

      expect(texte('.message.error p')).toBe('Le fichier est trop volumineux : 2 Mo au maximum.');
      expect(page().textContent).not.toContain('Maximum upload size');
    });

    it('413 sans corps JSON : le même message', async () => {
      await refusServeur(413, null);

      expect(texte('.message.error p')).toContain('2 Mo au maximum');
    });

    it('serveur en erreur : message générique, sans détail technique', async () => {
      await refusServeur(500, { detail: 'NullPointerException interne' });

      expect(texte('.message.error p')).toContain('L’importation a échoué');
      expect(page().textContent).not.toContain('NullPointerException');
    });

    it('serveur injoignable : le dit', async () => {
      const requete = await lancerImport();

      requete.error(new ProgressEvent('error'));
      fixture.detectChanges();

      expect(texte('.message.error p')).toContain('Serveur injoignable');
    });

    it('garde le fichier choisi après un refus, pour le retirer ou réessayer', async () => {
      await refusServeur(422, {
        detail: 'Colonnes obligatoires absentes de l’en-tête : nom_mere.',
      });

      expect(page().querySelector('.file-selected')).not.toBeNull();
      expect(importer().disabled).toBe(false);
    });

    it('efface le refus quand on choisit un autre fichier', async () => {
      await refusServeur(422, { detail: 'refusé' });

      await choisir(csv(EXEMPLE_BACKEND, 'autre.csv'));

      expect(page().querySelector('.message.error')).toBeNull();
    });
  });

  describe('modèle CSV', () => {
    it('génère côté client le modèle : en-tête exact et ligne d’exemple', async () => {
      let blob: Blob | undefined;
      let adresseRevoquee = '';
      let lien: HTMLAnchorElement | undefined;
      URL.createObjectURL = vi.fn((b: Blob) => {
        blob = b;
        return 'blob:modele';
      });
      URL.revokeObjectURL = vi.fn((a: string) => {
        adresseRevoquee = a;
      });
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement,
      ) {
        lien = this;
      });

      (page().querySelector('.lien-modele') as HTMLButtonElement).click();

      expect(lien?.download).toBe('modele-import-eleves.csv');
      expect(lien?.getAttribute('href')).toBe('blob:modele');
      expect(adresseRevoquee).toBe('blob:modele');
      expect(blob?.type).toContain('text/csv');
      expect(await blob?.text()).toBe(modeleCsv().replace(/^\uFEFF/, ''));
    });
  });

  describe('consignes et navigation', () => {
    it('explique le format Excel « CSV UTF-8 (délimité par des points-virgules) »', () => {
      expect(texte('.instructions-card')).toContain('CSV UTF-8 (délimité par des points-virgules)');
    });

    it('liste les colonnes obligatoires', () => {
      expect(texte('.instructions-card')).toContain(
        'prenom, nom, sexe, date_naissance, commune_naissance, code_ecole, classe, nom_mere',
      );
    });

    it('renvoie vers le tableau de bord, pas vers l’écran des élèves', () => {
      expect(page().querySelector('.back-link')?.getAttribute('href')).toBe('/dashboard');
      expect(page().innerHTML).not.toContain('href="/eleves"');
    });

    it('place le champ fichier dans son libellé, sans display: none : il reste atteignable au clavier', () => {
      const champ = page().querySelector('#csvFile') as HTMLInputElement;

      expect(champ.closest('label')).not.toBeNull();
      expect(champ.hasAttribute('hidden')).toBe(false);
    });

    it('ne journalise rien dans la console', async () => {
      const erreur = vi.spyOn(console, 'error');
      const journal = vi.spyOn(console, 'log');

      (await lancerImport()).flush(RAPPORT_PARTIEL);

      expect(erreur).not.toHaveBeenCalled();
      expect(journal).not.toHaveBeenCalled();
    });
  });
});
