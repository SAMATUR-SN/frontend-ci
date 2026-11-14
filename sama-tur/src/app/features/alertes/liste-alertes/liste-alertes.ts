import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, of, switchMap } from 'rxjs';

import { DossierResume } from '../../../core/models/dossier.model';
import { Option } from '../../../core/models/referentiel.model';
import { AlerteService } from '../../../core/services/alerte';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { TokenStorage } from '../../../core/services/token-storage';
import { ROLES_VERIFICATION, roleAutorise } from '../../../core/utils/acces';
import { libelleEtape } from '../../../core/utils/etapes';
import { extraireProbleme } from '../../../core/utils/probleme';

/** « N nouvelle(s) alerte(s) enregistrée(s) », accordé. */
export function messageVerification(nombre: number): string {
  if (nombre <= 0) {
    return 'Aucune nouvelle alerte enregistrée.';
  }
  return nombre === 1
    ? '1 nouvelle alerte enregistrée.'
    : `${nombre} nouvelles alertes enregistrées.`;
}

function messageChargement(status: number): string {
  if (status === 403) {
    return 'Votre rôle ne permet pas de consulter les alertes.';
  }
  if (status === 0) {
    return 'Serveur injoignable. Vérifiez la connexion, puis réessayez.';
  }
  return 'Impossible de charger les dossiers en retard. Réessayez dans un instant.';
}

@Component({
  selector: 'app-liste-alertes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './liste-alertes.html',
  styleUrl: './liste-alertes.scss',
})
export class ListeAlertes {
  private readonly alerteService = inject(AlerteService);
  private readonly referentiel = inject(ReferentielService);

  /** Seul l'état civil déclenche la vérification : le bouton n'existe pas pour les autres. */
  protected readonly peutVerifier = roleAutorise(
    inject(TokenStorage).getRole(),
    ROLES_VERIFICATION,
  );
  protected readonly libelleEtape = libelleEtape;

  protected readonly communes = signal<Option[]>([]);
  protected readonly communeId = signal<number | null>(null);

  protected readonly dossiers = signal<DossierResume[]>([]);
  protected readonly chargement = signal(false);
  protected readonly messageErreur = signal('');
  protected readonly nombre = computed(() => this.dossiers().length);

  protected readonly verificationEnCours = signal(false);
  protected readonly confirmation = signal('');
  protected readonly erreurVerification = signal('');

  private readonly charger$ = new Subject<void>();

  constructor() {
    // switchMap : changer de commune avant la réponse abandonne la requête précédente.
    this.charger$
      .pipe(
        switchMap(() => {
          this.chargement.set(true);
          this.messageErreur.set('');

          return this.alerteService.listerEnRetard(this.communeId()).pipe(
            catchError((erreur) => {
              this.messageErreur.set(messageChargement(extraireProbleme(erreur).status));
              this.chargement.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((dossiers) => {
        this.dossiers.set(dossiers);
        this.chargement.set(false);
      });

    this.referentiel
      .communes()
      .pipe(
        catchError(() => of([] as Option[])),
        takeUntilDestroyed(),
      )
      .subscribe((communes) => this.communes.set(communes));

    this.charger$.next();
  }

  protected actualiser(): void {
    this.charger$.next();
  }

  protected choisirCommune(valeur: string): void {
    this.communeId.set(valeur ? Number(valeur) : null);
    this.charger$.next();
  }

  protected verifier(): void {
    if (!this.peutVerifier || this.verificationEnCours()) {
      return;
    }

    this.verificationEnCours.set(true);
    this.confirmation.set('');
    this.erreurVerification.set('');

    this.alerteService.verifier().subscribe({
      next: (resultat) => {
        this.confirmation.set(messageVerification(resultat.alertesCreees));
        this.verificationEnCours.set(false);
      },
      error: (erreur) => {
        this.erreurVerification.set(
          extraireProbleme(erreur).status === 403
            ? 'Votre rôle ne permet pas de vérifier les retards.'
            : 'La vérification n’a pas pu être lancée. Réessayez dans un instant.',
        );
        this.verificationEnCours.set(false);
      },
    });
  }
}
