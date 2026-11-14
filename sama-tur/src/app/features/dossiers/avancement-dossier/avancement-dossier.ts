import {
  Component,
  DestroyRef,
  WritableSignal,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, catchError, of, take } from 'rxjs';

import {
  DossierDetail,
  PREUVES_NAISSANCE,
  StatutDossier,
  TYPES_AUDIENCE,
} from '../../../core/models/dossier.model';
import { Option } from '../../../core/models/referentiel.model';
import { DossierService } from '../../../core/services/dossier';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { TokenStorage } from '../../../core/services/token-storage';
import {
  aujourdhui,
  construireRequete,
  derniereDate,
  validerDate,
} from '../../../core/utils/avancement';
import { formaterDate } from '../../../core/utils/dates';
import { etapeSuivante, libelleEtape, roleRequis } from '../../../core/utils/etapes';
import { extraireProbleme } from '../../../core/utils/probleme';
import { libelleRole } from '../../../core/utils/roles';

const LIBELLES_PREUVE: Record<(typeof PREUVES_NAISSANCE)[number], string> = {
  CERTIFICAT_ACCOUCHEMENT: 'Certificat d’accouchement',
  TEMOINS: 'Deux témoins',
};

const LIBELLES_AUDIENCE: Record<(typeof TYPES_AUDIENCE)[number], string> = {
  ORDINAIRE: 'Ordinaire',
  SPECIALE: 'Spéciale',
  FORAINE: 'Foraine',
};

const MESSAGES_SERVEUR: Record<string, string> = {
  obligatoire: 'Ce champ est obligatoire.',
  invalide: 'Cette valeur est invalide.',
};

/**
 * Passage du dossier à l'étape suivante. Le formulaire n'existe que pour le rôle que le contrat
 * exige à cette étape ; tout autre rôle (le superviseur n'en a jamais) lit seulement qui doit agir.
 * L'étape cible n'est jamais saisie : elle se déduit de l'étape du dossier.
 */
@Component({
  selector: 'app-avancement-dossier',
  standalone: true,
  imports: [ReactiveFormsModule, NgTemplateOutlet],
  templateUrl: './avancement-dossier.html',
  styleUrl: './avancement-dossier.scss',
})
export class AvancementDossier {
  private readonly dossierService = inject(DossierService);
  private readonly referentiel = inject(ReferentielService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly destroyRef = inject(DestroyRef);
  private readonly role = inject(TokenStorage).getRole();

  readonly dossier = input.required<DossierDetail>();
  /** Le dossier à jour, renvoyé par le backend après un avancement réussi. */
  readonly avance = output<DossierDetail>();
  /** Le dossier a changé entre-temps (409) : la fiche doit être rechargée. */
  readonly conflit = output<void>();

  protected readonly preuves = PREUVES_NAISSANCE;
  protected readonly audiences = TYPES_AUDIENCE;
  protected readonly libellePreuve = (p: (typeof PREUVES_NAISSANCE)[number]) => LIBELLES_PREUVE[p];
  protected readonly libelleAudience = (a: (typeof TYPES_AUDIENCE)[number]) => LIBELLES_AUDIENCE[a];
  protected readonly dateMax = aujourdhui();

  protected readonly centres = signal<Option[]>([]);
  protected readonly tribunaux = signal<Option[]>([]);
  protected readonly listeIndisponible = signal(false);

  protected readonly envoi = signal(false);
  protected readonly bandeau = signal('');
  protected readonly horsChamps = signal<string[]>([]);
  protected readonly confirmation = signal('');
  private readonly erreursServeur = signal<Record<string, string>>({});

  protected readonly etapeCible = computed(() => etapeSuivante(this.dossier().etape));
  protected readonly libelleCible = computed(() => {
    const cible = this.etapeCible();
    return cible ? libelleEtape(cible) : '';
  });
  protected readonly dateMin = computed(() => derniereDate(this.dossier()));

  /** Le rôle de l'utilisateur est celui que le contrat exige pour l'étape visée. */
  protected readonly peutAvancer = computed(() => {
    const cible = this.etapeCible();
    return cible !== null && this.role !== null && this.role === roleRequis(cible);
  });

  protected readonly messageLecture = computed(() => {
    const cible = this.etapeCible();
    if (cible === null) {
      return 'Dossier terminé : l’acte a été remis, aucune action n’est possible.';
    }
    const requis = roleRequis(cible);
    return `Prochaine étape : ${libelleEtape(cible)}, à saisir par ${requis ? libelleRole(requis) : '—'}.`;
  });

  /** Un formulaire neuf à chaque dossier reçu : il est donc vidé après un avancement réussi. */
  protected readonly formulaire = computed(() => {
    const cible = this.etapeCible();
    return cible !== null && this.peutAvancer() ? this.construireFormulaire(cible) : null;
  });

  constructor() {
    effect(() => {
      if (!this.peutAvancer()) {
        return;
      }
      const cible = this.etapeCible();
      untracked(() => {
        if (cible === 'CERTIFICAT_OBTENU') {
          this.charger(this.referentiel.centres(), this.centres);
        } else if (cible === 'JUGEMENT_RENDU') {
          this.charger(this.referentiel.tribunaux(), this.tribunaux);
        }
      });
    });
  }

  protected valider(): void {
    const formulaire = this.formulaire();
    const cible = this.etapeCible();

    if (!formulaire || cible === null || this.envoi()) {
      return;
    }

    formulaire.markAllAsTouched();
    if (formulaire.invalid) {
      return;
    }

    this.envoi.set(true);
    this.bandeau.set('');
    this.horsChamps.set([]);
    this.confirmation.set('');
    this.erreursServeur.set({});

    this.dossierService
      .avancer(this.dossier().id, construireRequete(cible, formulaire.getRawValue()))
      .subscribe({
        next: (dossier) => {
          this.envoi.set(false);
          this.confirmation.set(
            `Le dossier est passé à l’étape « ${libelleEtape(dossier.etape)} ».`,
          );
          this.avance.emit(dossier);
        },
        error: (erreur) => {
          this.envoi.set(false);
          this.traiterErreur(erreur);
        },
      });
  }

  /** Message d'un champ : refus du serveur d'abord, puis règle locale une fois le champ touché. */
  protected erreur(chemin: string): string | null {
    const serveur = this.erreursServeur()[chemin];
    if (serveur) {
      return serveur;
    }

    const controle = this.formulaire()?.get(chemin);
    if (!controle || !controle.invalid || !(controle.touched || controle.dirty)) {
      return null;
    }

    const e = controle.errors ?? {};
    if (e['required']) {
      return 'Ce champ est obligatoire.';
    }
    if (e['maxlength']) {
      return `${e['maxlength'].requiredLength} caractères au maximum.`;
    }
    if (e['dateAvant']) {
      return `La date ne peut pas précéder le ${formaterDate(e['dateAvant'].min)}.`;
    }
    if (e['dateFuture']) {
      return 'La date ne peut pas être dans le futur.';
    }
    if (e['dateInvalide']) {
      return 'Date invalide.';
    }
    if (e['pattern']) {
      return 'Saisissez une année à quatre chiffres.';
    }
    return 'Cette valeur est invalide.';
  }

  protected temoins(): FormGroup[] {
    const liste = this.formulaire()?.get('temoins');
    return liste instanceof FormArray ? (liste.controls as FormGroup[]) : [];
  }

  private charger(source: Observable<Option[]>, cible: WritableSignal<Option[]>): void {
    this.listeIndisponible.set(false);
    source
      .pipe(
        catchError(() => {
          this.listeIndisponible.set(true);
          return of([] as Option[]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((liste) => cible.set(liste));
  }

  private construireFormulaire(cible: StatutDossier): FormGroup {
    const dossier = this.dossier();
    const dates = [Validators.required, validerDate(derniereDate(dossier), this.dateMax)];
    const obligatoire = (max: number) => [Validators.required, Validators.maxLength(max)];

    switch (cible) {
      case 'CERTIFICAT_OBTENU':
        return this.fb.group({
          numeroCertificat: ['', obligatoire(100)],
          dateCertificat: ['', dates],
          centreEtatCivilId: ['', Validators.required],
          commentaire: this.commentaire(),
        });
      case 'DOSSIER_COMPLET':
        return this.formulairePreuve();
      case 'JUGEMENT_RENDU':
        return this.fb.group({
          numeroJugement: ['', obligatoire(100)],
          dateJugement: ['', dates],
          tribunalId: ['', Validators.required],
          typeAudience: ['', Validators.required],
          commentaire: this.commentaire(),
        });
      case 'TRANSCRIT':
        return this.fb.group({
          numeroActe: ['', obligatoire(100)],
          anneeActe: [
            String(new Date().getFullYear()),
            [Validators.required, Validators.pattern(/^\d{4}$/)],
          ],
          dateTranscription: ['', dates],
          commentaire: this.commentaire(),
        });
      default:
        return this.fb.group({ dateRemise: ['', dates], commentaire: this.commentaire() });
    }
  }

  private commentaire() {
    return this.fb.control('', [Validators.maxLength(500)]);
  }

  /** Les deux témoins n'existent dans le formulaire que pour la preuve TEMOINS. */
  private formulairePreuve(): FormGroup {
    const temoin = () =>
      this.fb.group({
        nomComplet: ['', [Validators.required, Validators.maxLength(200)]],
        numeroPiece: ['', [Validators.required, Validators.maxLength(100)]],
      });
    const temoins = this.fb.array<FormGroup>([]);
    const formulaire = this.fb.group({
      preuveNaissance: ['', Validators.required],
      temoins,
      commentaire: this.commentaire(),
    });

    formulaire.controls['preuveNaissance'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((preuve) => {
        temoins.clear();
        if (preuve === 'TEMOINS') {
          temoins.push(temoin());
          temoins.push(temoin());
        }
      });

    return formulaire as unknown as FormGroup;
  }

  private traiterErreur(erreur: unknown): void {
    const probleme = extraireProbleme(erreur);

    if (probleme.status === 409) {
      this.bandeau.set('Ce dossier a déjà été modifié. La fiche est rechargée.');
      this.conflit.emit();
      return;
    }
    if (probleme.status === 422) {
      this.bandeau.set(probleme.detail || 'Le dossier n’a pas pu avancer : vérifiez les champs.');
      this.rattacherErreurs(probleme.erreurs);
      return;
    }
    if (probleme.status === 403) {
      this.bandeau.set('Votre rôle ne permet pas de faire avancer ce dossier à cette étape.');
    } else if (probleme.status === 404) {
      this.bandeau.set('Ce dossier est introuvable : il a peut-être été archivé.');
    } else if (probleme.status === 400) {
      this.bandeau.set('Le serveur n’a pas compris la demande. Rechargez la page, puis réessayez.');
    } else if (probleme.status === 0) {
      this.bandeau.set('Serveur injoignable. Vérifiez la connexion, puis réessayez.');
    } else {
      this.bandeau.set('Le dossier n’a pas pu avancer. Réessayez dans un instant.');
    }
  }

  /** Chaque champ refusé par le serveur s'affiche sous son contrôle ; les autres, dans le bandeau. */
  private rattacherErreurs(erreurs: { champ: string; message: string }[]): void {
    const formulaire = this.formulaire();
    const parChamp: Record<string, string> = {};
    const ailleurs: string[] = [];

    for (const { champ, message } of erreurs) {
      const chemin = champ.replace(/\[(\d+)\]/g, '.$1');
      const texte = MESSAGES_SERVEUR[message] ?? message;
      const controle = formulaire?.get(chemin);

      if (controle) {
        parChamp[chemin] = texte;
        controle.markAsTouched();
        // La correction du champ efface son message : il ne décrit plus la valeur saisie.
        controle.valueChanges.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() =>
          this.erreursServeur.update((courantes) => {
            const reste = { ...courantes };
            delete reste[chemin];
            return reste;
          }),
        );
      } else {
        ailleurs.push(`${champ} : ${texte}`);
      }
    }

    this.erreursServeur.set(parChamp);
    this.horsChamps.set(ailleurs);
  }
}
