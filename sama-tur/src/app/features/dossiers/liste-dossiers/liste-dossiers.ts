import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, debounceTime, of, switchMap } from 'rxjs';

import { CLASSES, Classe } from '../../../core/models/classe.model';
import {
  DossierResume,
  ETAPES,
  FiltreDossiers,
  StatutDossier,
  TRIS_DOSSIERS,
  TriDossiers,
} from '../../../core/models/dossier.model';
import { Page } from '../../../core/models/page.model';
import { Ecole, Option } from '../../../core/models/referentiel.model';
import { DossierService } from '../../../core/services/dossier';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { formaterDate } from '../../../core/utils/dates';
import { libelleEtape } from '../../../core/utils/etapes';
import { extraireProbleme } from '../../../core/utils/probleme';

const TAILLE_PAGE = 20;
const DELAI_RECHERCHE_MS = 300;

type EtatRetard = 'tous' | 'oui' | 'non';

const LIBELLES_TRI: Record<TriDossiers, string> = {
  'dateDetection,desc': 'Détection : plus récents d’abord',
  'dateDetection,asc': 'Détection : plus anciens d’abord',
  'dateJugement,desc': 'Jugement : plus récents d’abord',
  'dateJugement,asc': 'Jugement : plus anciens d’abord',
  'reference,asc': 'Référence : A → Z',
  'reference,desc': 'Référence : Z → A',
};

/** Le 401 est traité par l'intercepteur (retour à la connexion) : il n'a pas de message ici. */
function messagePourStatut(status: number): string {
  if (status === 0) {
    return 'Serveur injoignable. Vérifiez la connexion, puis réessayez.';
  }
  if (status === 403) {
    return 'Votre rôle ne permet pas de consulter cette liste.';
  }
  if (status === 400) {
    return 'Un filtre ou le tri n’a pas été reconnu par le serveur. Réinitialisez les filtres.';
  }
  return 'Impossible de charger les dossiers. Réessayez dans un instant.';
}

@Component({
  selector: 'app-liste-dossiers',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './liste-dossiers.html',
  styleUrl: './liste-dossiers.scss',
})
export class ListeDossiers {
  private readonly dossierService = inject(DossierService);
  private readonly referentiel = inject(ReferentielService);

  protected readonly etapes = ETAPES;
  protected readonly classes = CLASSES;
  protected readonly tris = TRIS_DOSSIERS;
  protected readonly libelleEtape = libelleEtape;
  protected readonly formaterDate = formaterDate;
  protected readonly libelleTri = (tri: TriDossiers): string => LIBELLES_TRI[tri];

  protected readonly communes = signal<Option[]>([]);
  protected readonly ecoles = signal<Ecole[]>([]);

  // Filtres
  protected readonly etape = signal<StatutDossier | null>(null);
  protected readonly communeId = signal<number | null>(null);
  protected readonly ecoleId = signal<number | null>(null);
  protected readonly classe = signal<Classe | null>(null);
  protected readonly retard = signal<EtatRetard>('tous');
  protected readonly tri = signal<TriDossiers>('dateDetection,desc');
  protected readonly page = signal(0);

  /** Saisie affichée dans le champ ; la valeur envoyée au serveur suit après l'anti-rebond. */
  protected readonly recherche = signal('');
  private readonly rechercheAppliquee = signal('');

  // Résultat
  private readonly resultat = signal<Page<DossierResume> | null>(null);
  protected readonly chargement = signal(false);
  protected readonly messageErreur = signal('');

  protected readonly dossiers = computed(() => this.resultat()?.contenu ?? []);
  protected readonly total = computed(() => this.resultat()?.totalElements ?? 0);
  protected readonly totalPages = computed(() => this.resultat()?.totalPages ?? 0);
  protected readonly filtreActif = computed(
    () =>
      this.etape() !== null ||
      this.communeId() !== null ||
      this.ecoleId() !== null ||
      this.classe() !== null ||
      this.retard() !== 'tous' ||
      this.rechercheAppliquee() !== '',
  );

  private readonly declencheur$ = new Subject<void>();
  private readonly saisieRecherche$ = new Subject<string>();

  constructor() {
    // switchMap : la réponse d'une requête remplacée par une plus récente est abandonnée.
    this.declencheur$
      .pipe(
        switchMap(() => {
          this.chargement.set(true);
          this.messageErreur.set('');

          return this.dossierService
            .lister(this.filtreServeur(), this.page(), TAILLE_PAGE, this.tri())
            .pipe(
              catchError((erreur) => {
                this.messageErreur.set(messagePourStatut(extraireProbleme(erreur).status));
                this.chargement.set(false);
                return EMPTY;
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((resultat) => {
        this.resultat.set(resultat);
        this.chargement.set(false);
      });

    this.saisieRecherche$
      .pipe(debounceTime(DELAI_RECHERCHE_MS), takeUntilDestroyed())
      .subscribe((saisie) => {
        const recherche = saisie.trim();
        if (recherche !== this.rechercheAppliquee()) {
          this.rechercheAppliquee.set(recherche);
          this.rechargerDepuisLeDebut();
        }
      });

    this.referentiel
      .communes()
      .pipe(
        catchError(() => of([] as Option[])),
        takeUntilDestroyed(),
      )
      .subscribe((communes) => this.communes.set(communes));

    this.referentiel
      .ecoles()
      .pipe(
        catchError(() => of([] as Ecole[])),
        takeUntilDestroyed(),
      )
      .subscribe((ecoles) => this.ecoles.set(ecoles));

    this.declencheur$.next();
  }

  protected choisirEtape(valeur: string): void {
    this.etape.set(valeur ? (valeur as StatutDossier) : null);
    this.rechargerDepuisLeDebut();
  }

  protected choisirCommune(valeur: string): void {
    this.communeId.set(valeur ? Number(valeur) : null);
    this.rechargerDepuisLeDebut();
  }

  protected choisirEcole(valeur: string): void {
    this.ecoleId.set(valeur ? Number(valeur) : null);
    this.rechargerDepuisLeDebut();
  }

  protected choisirClasse(valeur: string): void {
    this.classe.set(valeur ? (valeur as Classe) : null);
    this.rechargerDepuisLeDebut();
  }

  protected choisirRetard(valeur: string): void {
    this.retard.set(valeur === 'oui' || valeur === 'non' ? valeur : 'tous');
    this.rechargerDepuisLeDebut();
  }

  protected choisirTri(valeur: string): void {
    this.tri.set(valeur as TriDossiers);
    this.rechargerDepuisLeDebut();
  }

  protected saisirRecherche(valeur: string): void {
    this.recherche.set(valeur);
    this.saisieRecherche$.next(valeur);
  }

  protected reinitialiser(): void {
    this.etape.set(null);
    this.communeId.set(null);
    this.ecoleId.set(null);
    this.classe.set(null);
    this.retard.set('tous');
    this.tri.set('dateDetection,desc');
    this.recherche.set('');
    this.rechercheAppliquee.set('');
    // Écrase une saisie encore en attente d'anti-rebond : elle ne se réappliquera pas.
    this.saisieRecherche$.next('');
    this.rechargerDepuisLeDebut();
  }

  protected precedente(): void {
    if (this.page() > 0) {
      this.page.update((p) => p - 1);
      this.declencheur$.next();
    }
  }

  protected suivante(): void {
    if (this.page() + 1 < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.declencheur$.next();
    }
  }

  protected actualiser(): void {
    this.declencheur$.next();
  }

  private rechargerDepuisLeDebut(): void {
    this.page.set(0);
    this.declencheur$.next();
  }

  private filtreServeur(): FiltreDossiers {
    return {
      etape: this.etape() ?? undefined,
      communeId: this.communeId() ?? undefined,
      ecoleId: this.ecoleId() ?? undefined,
      classe: this.classe() ?? undefined,
      enRetard: this.retard() === 'tous' ? undefined : this.retard() === 'oui',
      q: this.rechercheAppliquee(),
    };
  }
}
