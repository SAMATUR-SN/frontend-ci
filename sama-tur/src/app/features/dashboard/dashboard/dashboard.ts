import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, of, switchMap } from 'rxjs';

import { DossierResume, ETAPES } from '../../../core/models/dossier.model';
import { Indicateurs } from '../../../core/models/indicateurs.model';
import { Option } from '../../../core/models/referentiel.model';
import { AuthService } from '../../../core/services/auth.service';
import { DossierService } from '../../../core/services/dossier';
import { IndicateursService } from '../../../core/services/indicateurs.service';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { TokenStorage } from '../../../core/services/token-storage';
import { ROLES_ALERTES, ROLES_IMPORT, roleAutorise } from '../../../core/utils/acces';
import { formaterDate } from '../../../core/utils/dates';
import { libelleEtape } from '../../../core/utils/etapes';
import { libelleRole } from '../../../core/utils/roles';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly router = inject(Router);
  private readonly indicateursService = inject(IndicateursService);
  private readonly dossierService = inject(DossierService);
  private readonly referentiel = inject(ReferentielService);

  // Utilisateur connecté
  private readonly role = this.tokenStorage.getRole();
  protected readonly utilisateur = this.tokenStorage.getUtilisateur();
  protected readonly libelleRole = this.role ? libelleRole(this.role) : 'Rôle non défini';
  protected readonly peutVoirAlertes = roleAutorise(this.role, ROLES_ALERTES);
  protected readonly peutImporter = roleAutorise(this.role, ROLES_IMPORT);

  protected readonly dateDuJour = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  protected readonly libelleEtape = libelleEtape;
  protected readonly formaterDate = formaterDate;

  // Chiffres : une seule requête (GET /api/indicateurs), filtrée par commune de naissance.
  protected readonly communes = signal<Option[]>([]);
  protected readonly communeId = signal<number | null>(null);
  protected readonly indicateurs = signal<Indicateurs | null>(null);
  protected readonly chargementIndicateurs = signal(false);
  protected readonly erreurIndicateurs = signal(false);

  // Les cinq derniers dossiers
  protected readonly recents = signal<DossierResume[]>([]);
  protected readonly chargementRecents = signal(false);
  protected readonly erreurRecents = signal(false);

  protected readonly enChargement = computed(
    () => this.chargementIndicateurs() || this.chargementRecents(),
  );
  protected readonly erreur = computed(() => this.erreurIndicateurs() || this.erreurRecents());

  /** Les six étapes, toujours : une étape absente de la réponse vaut 0. */
  protected readonly repartition = computed(() => {
    const indicateurs = this.indicateurs();
    if (!indicateurs) {
      return [];
    }
    const total = indicateurs.totalDossiers;

    return ETAPES.map((etape) => {
      const nombre = indicateurs.dossiersParEtape[etape] ?? 0;
      return { etape, nombre, part: total > 0 ? (nombre / total) * 100 : 0 };
    });
  });

  private readonly chargerIndicateurs$ = new Subject<void>();
  private readonly chargerRecents$ = new Subject<void>();

  constructor() {
    this.chargerRecents$
      .pipe(
        switchMap(() => {
          this.chargementRecents.set(true);
          this.erreurRecents.set(false);

          // Les cinq derniers dossiers, tous périmètres confondus.
          return this.dossierService.lister({}, 0, 5).pipe(
            catchError(() => {
              this.erreurRecents.set(true);
              this.chargementRecents.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        this.recents.set(page.contenu);
        this.chargementRecents.set(false);
      });

    // switchMap : changer de commune avant la réponse abandonne la requête précédente.
    this.chargerIndicateurs$
      .pipe(
        switchMap(() => {
          this.chargementIndicateurs.set(true);
          this.erreurIndicateurs.set(false);

          return this.indicateursService.obtenir(this.communeId()).pipe(
            catchError(() => {
              this.erreurIndicateurs.set(true);
              this.chargementIndicateurs.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((indicateurs) => {
        this.indicateurs.set(indicateurs);
        this.chargementIndicateurs.set(false);
      });

    this.referentiel
      .communes()
      .pipe(
        catchError(() => of([] as Option[])),
        takeUntilDestroyed(),
      )
      .subscribe((communes) => this.communes.set(communes));

    this.actualiser();
  }

  protected actualiser(): void {
    this.chargerIndicateurs$.next();
    this.chargerRecents$.next();
  }

  protected choisirCommune(valeur: string): void {
    this.communeId.set(valeur ? Number(valeur) : null);
    this.chargerIndicateurs$.next();
  }

  protected deconnecter(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
