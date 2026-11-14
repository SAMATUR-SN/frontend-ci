import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DossierDetail, ETAPES } from '../../../core/models/dossier.model';
import { ROLES, Role } from '../../../core/models/utilisateur.model';
import { TokenStorage } from '../../../core/services/token-storage';
import { unDossierDetail } from '../../../core/testing/dossier-test';
import { uneReponseConnexion } from '../../../core/testing/session-test';
import { aujourdhui } from '../../../core/utils/avancement';
import { etapeSuivante, roleRequis } from '../../../core/utils/etapes';
import { AvancementDossier } from './avancement-dossier';

const URL_AVANCER = '/api/dossiers/12/avancer';

describe('AvancementDossier', () => {
  let fixture: ComponentFixture<AvancementDossier>;
  let controleur: HttpTestingController;
  let avances: DossierDetail[];
  let conflits: number;

  const page = () => fixture.nativeElement as HTMLElement;
  const formulaire = () => page().querySelector('form');
  const bouton = () => page().querySelector('button[type="submit"]') as HTMLButtonElement;
  const texte = (selecteur: string) => page().querySelector(selecteur)?.textContent?.trim() ?? null;

  /** Monte le panneau pour `role` sur `dossier`, et sert les listes de référence demandées. */
  function monter(role: Role | null, dossier: DossierDetail): void {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [AvancementDossier],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    if (role) {
      TestBed.inject(TokenStorage).enregistrer(uneReponseConnexion(role));
    }
    controleur = TestBed.inject(HttpTestingController);
    avances = [];
    conflits = 0;

    fixture = TestBed.createComponent(AvancementDossier);
    fixture.componentRef.setInput('dossier', dossier);
    fixture.componentInstance.avance.subscribe((d) => avances.push(d));
    fixture.componentInstance.conflit.subscribe(() => conflits++);
    fixture.detectChanges();

    for (const requete of controleur.match((r) => r.url.startsWith('/api/referentiels/'))) {
      requete.flush(
        requete.request.url.endsWith('/centres')
          ? [
              { id: 3, nom: 'Centre de test' },
              { id: 4, nom: 'Autre centre' },
            ]
          : [
              { id: 2, nom: 'Tribunal de test' },
              { id: 9, nom: 'Autre tribunal' },
            ],
      );
    }
    fixture.detectChanges();
  }

  function saisir(id: string, valeur: string): void {
    const champ = page().querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event(champ.tagName === 'SELECT' ? 'change' : 'input'));
    fixture.detectChanges();
  }

  const LIBELLES_CHOIX: Record<string, string> = {
    TEMOINS: 'Deux témoins',
    CERTIFICAT_ACCOUCHEMENT: 'Certificat d’accouchement',
    ORDINAIRE: 'Ordinaire',
    SPECIALE: 'Spéciale',
    FORAINE: 'Foraine',
  };

  /** Coche le choix par son libellé visible, comme le ferait l'utilisateur. */
  function cocher(valeur: string): void {
    const choix = Array.from(page().querySelectorAll('label.radio')).find((l) =>
      l.textContent?.includes(LIBELLES_CHOIX[valeur]),
    );
    (choix?.querySelector('input[type="radio"]') as HTMLInputElement).click();
    fixture.detectChanges();
  }

  function soumettre(): void {
    formulaire()?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  /** Renseigne un formulaire valable pour le passage à JUGEMENT_RENDU. */
  function remplirJugement(): void {
    saisir('av-numeroJugement', 'JUG-12');
    saisir('av-dateJugement', '2026-09-20');
    saisir('av-tribunalId', '2');
    cocher('FORAINE');
  }

  afterEach(() => {
    controleur.verify();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('qui peut agir', () => {
    const combinaisons = ROLES.flatMap((role) => ETAPES.map((etape) => [role, etape] as const));

    it.each(combinaisons)('%s sur un dossier à %s', (role, etape) => {
      monter(role, unDossierDetail(etape));

      const cible = etapeSuivante(etape);
      const attendu = cible !== null && roleRequis(cible) === role;

      expect(formulaire() !== null).toBe(attendu);
      expect(page().querySelector('.lecture') !== null).toBe(!attendu);
    });

    it('le superviseur n’a jamais de formulaire, à aucune étape', () => {
      for (const etape of ETAPES) {
        TestBed.resetTestingModule();
        monter('SUPERVISEUR', unDossierDetail(etape));

        expect(formulaire()).toBeNull();
        expect(page().querySelector('button[type="submit"]')).toBeNull();
        controleur.verify();
      }
    });

    it('dit qui doit saisir la prochaine étape quand ce n’est pas l’utilisateur', () => {
      monter('ECOLE', unDossierDetail('DETECTE'));

      expect(texte('.lecture')).toBe(
        'Prochaine étape : Certificat obtenu, à saisir par État civil.',
      );
    });

    it('dit que le dossier est terminé après la remise de l’acte', () => {
      monter('ECOLE', unDossierDetail('ACTE_REMIS'));

      expect(texte('.lecture')).toContain('Dossier terminé');
      expect(formulaire()).toBeNull();
    });

    it('n’interroge aucun référentiel quand l’utilisateur ne peut pas agir', () => {
      monter('TRIBUNAL', unDossierDetail('DETECTE'));

      controleur.expectNone((r) => r.url.startsWith('/api/referentiels/'));
    });

    it('ne propose aucune saisie sans session', () => {
      monter(null, unDossierDetail('DETECTE'));

      expect(formulaire()).toBeNull();
    });
  });

  describe('requête envoyée pour chacune des cinq étapes', () => {
    it('CERTIFICAT_OBTENU : numéro, date et centre choisi dans la liste', () => {
      monter('ETAT_CIVIL', unDossierDetail('DETECTE'));
      expect(Array.from(page().querySelectorAll('#av-centreEtatCivilId option')).length).toBe(3);

      saisir('av-numeroCertificat', ' CERT-9 ');
      saisir('av-dateCertificat', '2026-09-15');
      saisir('av-centreEtatCivilId', '3');
      soumettre();

      const requete = controleur.expectOne(URL_AVANCER);
      expect(requete.request.method).toBe('POST');
      expect(requete.request.body).toEqual({
        etapeCible: 'CERTIFICAT_OBTENU',
        numeroCertificat: 'CERT-9',
        dateCertificat: '2026-09-15',
        centreEtatCivilId: 3,
      });
      requete.flush(unDossierDetail('CERTIFICAT_OBTENU'));
    });

    it('DOSSIER_COMPLET avec témoins : deux blocs complets, puis la preuve et les deux témoins', () => {
      monter('ECOLE', unDossierDetail('CERTIFICAT_OBTENU'));
      expect(page().querySelector('#av-temoin-0-nom')).toBeNull();

      cocher('TEMOINS');
      expect(page().querySelectorAll('input[id^="av-temoin-"]').length).toBe(4);
      saisir('av-temoin-0-nom', 'Témoin Un');
      saisir('av-temoin-0-piece', 'P-1');
      saisir('av-temoin-1-nom', 'Témoin Deux');
      saisir('av-temoin-1-piece', 'P-2');
      soumettre();

      const requete = controleur.expectOne(URL_AVANCER);
      expect(requete.request.body).toEqual({
        etapeCible: 'DOSSIER_COMPLET',
        preuveNaissance: 'TEMOINS',
        temoins: [
          { nomComplet: 'Témoin Un', numeroPiece: 'P-1' },
          { nomComplet: 'Témoin Deux', numeroPiece: 'P-2' },
        ],
      });
      requete.flush(unDossierDetail('DOSSIER_COMPLET'));
    });

    it('DOSSIER_COMPLET avec certificat d’accouchement : aucun témoin n’est demandé ni envoyé', () => {
      monter('ECOLE', unDossierDetail('CERTIFICAT_OBTENU'));

      cocher('CERTIFICAT_ACCOUCHEMENT');
      expect(page().querySelector('#av-temoin-0-nom')).toBeNull();
      soumettre();

      const requete = controleur.expectOne(URL_AVANCER);
      expect(requete.request.body).toEqual({
        etapeCible: 'DOSSIER_COMPLET',
        preuveNaissance: 'CERTIFICAT_ACCOUCHEMENT',
      });
      requete.flush(unDossierDetail('DOSSIER_COMPLET'));
    });

    it('revenir de TEMOINS à certificat d’accouchement retire les témoins déjà saisis', () => {
      monter('ECOLE', unDossierDetail('CERTIFICAT_OBTENU'));
      cocher('TEMOINS');
      saisir('av-temoin-0-nom', 'Témoin Un');

      cocher('CERTIFICAT_ACCOUCHEMENT');
      soumettre();

      expect(page().querySelector('#av-temoin-0-nom')).toBeNull();
      const requete = controleur.expectOne(URL_AVANCER);
      expect(requete.request.body).not.toHaveProperty('temoins');
      requete.flush(unDossierDetail('DOSSIER_COMPLET'));
    });

    it('JUGEMENT_RENDU : numéro, date, tribunal de la liste et type d’audience', () => {
      monter('TRIBUNAL', unDossierDetail('DOSSIER_COMPLET'));

      remplirJugement();
      soumettre();

      const requete = controleur.expectOne(URL_AVANCER);
      expect(requete.request.body).toEqual({
        etapeCible: 'JUGEMENT_RENDU',
        numeroJugement: 'JUG-12',
        dateJugement: '2026-09-20',
        tribunalId: 2,
        typeAudience: 'FORAINE',
      });
      requete.flush(unDossierDetail('JUGEMENT_RENDU'));
    });

    it('TRANSCRIT : l’année de l’acte vaut l’année courante par défaut, et part en nombre', () => {
      monter('ETAT_CIVIL', unDossierDetail('JUGEMENT_RENDU'));
      const annee = String(new Date().getFullYear());
      expect((page().querySelector('#av-anneeActe') as HTMLInputElement).value).toBe(annee);

      saisir('av-numeroActe', 'ACTE-7');
      saisir('av-dateTranscription', '2026-10-01');
      soumettre();

      const requete = controleur.expectOne(URL_AVANCER);
      expect(requete.request.body).toEqual({
        etapeCible: 'TRANSCRIT',
        numeroActe: 'ACTE-7',
        anneeActe: Number(annee),
        dateTranscription: '2026-10-01',
      });
      requete.flush(unDossierDetail('TRANSCRIT'));
    });

    it('ACTE_REMIS : la seule date de remise, et le commentaire s’il est renseigné', () => {
      monter('ECOLE', unDossierDetail('TRANSCRIT'));

      saisir('av-dateRemise', '2026-10-10');
      saisir('av-commentaire', 'Remis à la mère');
      soumettre();

      const requete = controleur.expectOne(URL_AVANCER);
      expect(requete.request.body).toEqual({
        etapeCible: 'ACTE_REMIS',
        dateRemise: '2026-10-10',
        commentaire: 'Remis à la mère',
      });
      requete.flush(unDossierDetail('ACTE_REMIS'));
    });

    it('l’étape cible n’est jamais une saisie : elle se déduit de l’étape du dossier', () => {
      monter('TRIBUNAL', unDossierDetail('DOSSIER_COMPLET'));

      expect(page().querySelector('[formcontrolname="etapeCible"]')).toBeNull();
      expect(page().querySelector('[name="etapeCible"]')).toBeNull();
      expect(texte('.intro')).toContain('Jugement rendu');
    });
  });

  describe('validation avant envoi', () => {
    it('n’envoie rien et réclame chaque champ obligatoire', () => {
      monter('ETAT_CIVIL', unDossierDetail('DETECTE'));

      soumettre();

      controleur.expectNone(URL_AVANCER);
      for (const nom of ['numeroCertificat', 'dateCertificat', 'centreEtatCivilId']) {
        expect(texte(`#err-${nom}`)).toBe('Ce champ est obligatoire.');
        expect(page().querySelector(`#av-${nom}`)?.getAttribute('aria-invalid')).toBe('true');
      }
    });

    it('réclame les deux témoins complets avant d’envoyer', () => {
      monter('ECOLE', unDossierDetail('CERTIFICAT_OBTENU'));
      cocher('TEMOINS');
      saisir('av-temoin-0-nom', 'Témoin Un');

      soumettre();

      controleur.expectNone(URL_AVANCER);
      expect(texte('[id="err-temoins.0.numeroPiece"]')).toBe('Ce champ est obligatoire.');
      expect(texte('[id="err-temoins.1.nomComplet"]')).toBe('Ce champ est obligatoire.');
    });

    it('borne les dates : pas avant la dernière date du dossier, pas dans le futur', () => {
      monter('TRIBUNAL', unDossierDetail('DOSSIER_COMPLET'));
      const champ = page().querySelector('#av-dateJugement') as HTMLInputElement;

      expect(champ.getAttribute('min')).toBe('2026-09-10');
      expect(champ.getAttribute('max')).toBe(aujourdhui());

      saisir('av-dateJugement', '2026-09-09');
      expect(texte('#err-dateJugement')).toBe('La date ne peut pas précéder le 10/09/2026.');

      saisir('av-dateJugement', '2999-01-01');
      expect(texte('#err-dateJugement')).toBe('La date ne peut pas être dans le futur.');

      saisir('av-dateJugement', '2026-09-10');
      expect(page().querySelector('#err-dateJugement')).toBeNull();
    });

    it('exige une année de quatre chiffres', () => {
      monter('ETAT_CIVIL', unDossierDetail('JUGEMENT_RENDU'));

      saisir('av-anneeActe', '26');

      expect(texte('#err-anneeActe')).toBe('Saisissez une année à quatre chiffres.');
    });

    it('limite le commentaire à 500 caractères', () => {
      monter('ECOLE', unDossierDetail('TRANSCRIT'));

      saisir('av-commentaire', 'x'.repeat(501));

      expect(texte('#err-commentaire')).toBe('500 caractères au maximum.');
    });
  });

  describe('envoi en cours et succès', () => {
    it('désactive le bouton pendant l’envoi et n’envoie pas deux fois', () => {
      monter('ECOLE', unDossierDetail('TRANSCRIT'));
      saisir('av-dateRemise', '2026-10-10');

      soumettre();
      expect(bouton().disabled).toBe(true);
      expect(bouton().textContent).toContain('Enregistrement');
      soumettre();

      const requete = controleur.expectOne(URL_AVANCER);
      requete.flush(unDossierDetail('ACTE_REMIS'));
      fixture.detectChanges();
      expect(bouton().disabled).toBe(false);
    });

    it('rend le dossier à jour, confirme, et laisse la fiche remplacer le dossier', () => {
      monter('ECOLE', unDossierDetail('TRANSCRIT'));
      saisir('av-dateRemise', '2026-10-10');
      const termine = unDossierDetail('ACTE_REMIS');

      soumettre();
      controleur.expectOne(URL_AVANCER).flush(termine);
      fixture.detectChanges();

      expect(avances).toEqual([termine]);
      expect(texte('.confirmation')).toBe('Le dossier est passé à l’étape « Acte remis ».');

      fixture.componentRef.setInput('dossier', termine);
      fixture.detectChanges();

      expect(formulaire()).toBeNull();
      expect(texte('.lecture')).toContain('Dossier terminé');
      expect(texte('.confirmation')).toContain('Acte remis');
    });

    it('vide le formulaire quand le dossier est remplacé par un autre à la même étape', () => {
      monter('ECOLE', unDossierDetail('TRANSCRIT'));
      saisir('av-dateRemise', '2026-10-10');
      saisir('av-commentaire', 'brouillon');

      fixture.componentRef.setInput('dossier', unDossierDetail('TRANSCRIT'));
      fixture.detectChanges();

      expect((page().querySelector('#av-dateRemise') as HTMLInputElement).value).toBe('');
      expect((page().querySelector('#av-commentaire') as HTMLTextAreaElement).value).toBe('');
    });
  });

  describe('erreurs du backend', () => {
    function envoyerEtRepondre(
      corps: object,
      statut: number,
      dossier = unDossierDetail('DOSSIER_COMPLET'),
      role: Role = 'TRIBUNAL',
    ): void {
      monter(role, dossier);
      remplirJugement();
      soumettre();
      controleur.expectOne(URL_AVANCER).flush(corps, { status: statut, statusText: 'Erreur' });
      fixture.detectChanges();
    }

    it('422 : le détail en bannière et chaque champ refusé sous son contrôle', () => {
      envoyerEtRepondre(
        {
          type: 'https://samatur.sn/erreurs/champ-obligatoire',
          title: 'Champ obligatoire manquant',
          status: 422,
          detail: 'Le passage à JUGEMENT_RENDU exige : dateJugement, tribunalId.',
          erreurs: [
            { champ: 'dateJugement', message: 'obligatoire' },
            { champ: 'tribunalId', message: 'invalide' },
            { champ: 'champInconnu', message: 'refusé' },
          ],
        },
        422,
      );

      expect(texte('.bandeau-erreur p')).toBe(
        'Le passage à JUGEMENT_RENDU exige : dateJugement, tribunalId.',
      );
      expect(texte('#err-dateJugement')).toBe('Ce champ est obligatoire.');
      expect(texte('#err-tribunalId')).toBe('Cette valeur est invalide.');
      expect(page().querySelector('#av-dateJugement')?.getAttribute('aria-invalid')).toBe('true');
      // Un champ que le formulaire ne connaît pas n'est pas perdu : il passe dans le bandeau.
      expect(texte('.bandeau-erreur li')).toBe('champInconnu : refusé');
      expect(bouton().disabled).toBe(false);
    });

    it('422 : la correction d’un champ efface son message, pas celui des autres', () => {
      envoyerEtRepondre(
        {
          detail: 'Dates incohérentes.',
          erreurs: [
            { champ: 'dateJugement', message: 'invalide' },
            { champ: 'tribunalId', message: 'invalide' },
          ],
        },
        422,
      );

      saisir('av-dateJugement', '2026-09-21');

      expect(page().querySelector('#err-dateJugement')).toBeNull();
      expect(texte('#err-tribunalId')).toBe('Cette valeur est invalide.');
    });

    it('422 sans détail : un message par défaut', () => {
      envoyerEtRepondre({}, 422);

      expect(texte('.bandeau-erreur p')).toContain('vérifiez les champs');
    });

    it('422 : rattache l’erreur d’un témoin à son champ', () => {
      monter('ECOLE', unDossierDetail('CERTIFICAT_OBTENU'));
      cocher('TEMOINS');
      saisir('av-temoin-0-nom', 'Témoin Un');
      saisir('av-temoin-0-piece', 'P-1');
      saisir('av-temoin-1-nom', 'Témoin Deux');
      saisir('av-temoin-1-piece', 'P-1');
      soumettre();

      controleur.expectOne(URL_AVANCER).flush(
        {
          detail: 'Les deux témoins doivent être distincts.',
          erreurs: [{ champ: 'temoins[1].numeroPiece', message: 'invalide' }],
        },
        { status: 422, statusText: 'Unprocessable' },
      );
      fixture.detectChanges();

      expect(texte('[id="err-temoins.1.numeroPiece"]')).toBe('Cette valeur est invalide.');
    });

    it('409 : annonce la modification concurrente et demande le rechargement de la fiche', () => {
      envoyerEtRepondre({ detail: 'Étape déjà franchie.' }, 409);

      expect(texte('.bandeau-erreur p')).toContain('Ce dossier a déjà été modifié');
      expect(conflits).toBe(1);
      expect(avances.length).toBe(0);
    });

    it('le message du 409 reste affiché quand la fiche recharge le dossier', () => {
      envoyerEtRepondre({ detail: 'Étape déjà franchie.' }, 409);

      fixture.componentRef.setInput('dossier', unDossierDetail('JUGEMENT_RENDU'));
      fixture.detectChanges();

      expect(texte('.bandeau-erreur p')).toContain('Ce dossier a déjà été modifié');
      expect(texte('.lecture')).toContain('Prochaine étape : Transcrit');
    });

    it.each([
      [403, 'Votre rôle ne permet pas'],
      [404, 'introuvable'],
      [400, 'n’a pas compris'],
      [500, 'n’a pas pu avancer'],
    ])('%i : un message clair, sans détail technique', (statut, extrait) => {
      envoyerEtRepondre({ detail: 'NullPointerException interne' }, statut);

      expect(texte('.bandeau-erreur p')).toContain(extrait);
      expect(page().textContent).not.toContain('NullPointerException');
      expect(conflits).toBe(0);
    });

    it('serveur injoignable : le dit', () => {
      monter('TRIBUNAL', unDossierDetail('DOSSIER_COMPLET'));
      remplirJugement();
      soumettre();

      controleur.expectOne(URL_AVANCER).error(new ProgressEvent('error'));
      fixture.detectChanges();

      expect(texte('.bandeau-erreur p')).toContain('Serveur injoignable');
    });

    it('ne journalise rien dans la console', () => {
      const erreur = vi.spyOn(console, 'error');
      const journal = vi.spyOn(console, 'log');

      envoyerEtRepondre({ detail: 'x', erreurs: [] }, 422);

      expect(erreur).not.toHaveBeenCalled();
      expect(journal).not.toHaveBeenCalled();
    });
  });

  describe('listes de référence', () => {
    it('signale une liste indisponible sans bloquer la page', () => {
      sessionStorage.clear();
      TestBed.configureTestingModule({
        imports: [AvancementDossier],
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      TestBed.inject(TokenStorage).enregistrer(uneReponseConnexion('ETAT_CIVIL'));
      controleur = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(AvancementDossier);
      fixture.componentRef.setInput('dossier', unDossierDetail('DETECTE'));
      fixture.detectChanges();

      controleur
        .expectOne('/api/referentiels/centres')
        .flush(null, { status: 500, statusText: 'Erreur' });
      fixture.detectChanges();

      expect(page().textContent).toContain('La liste des centres est indisponible');
      expect(formulaire()).not.toBeNull();
    });
  });
});
