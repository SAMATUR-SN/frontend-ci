
import {
  Component,
  inject,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { EleveService } from '../../../core/services/eleve.service';

import {
  EleveRequest,
  Ecole,
  Commune
} from '../../../core/models/eleve.model';

// Refuse les champs contenant uniquement des espaces
function texteNonVide(control: AbstractControl): ValidationErrors | null {
  if (typeof control.value !== 'string') {
    return null;
  }

  return control.value.trim().length > 0
    ? null
    : { texteVide: true };
}

// Empêche une date de naissance future
function dateNonFuture(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const dateSaisie = new Date(`${control.value}T00:00:00`);

  if (Number.isNaN(dateSaisie.getTime())) {
    return { dateInvalide: true };
  }

  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);

  return dateSaisie > aujourdHui
    ? { dateFuture: true }
    : null;
}

@Component({
  selector: 'app-ajout-eleve',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ajout-eleve.html',
  styleUrl: './ajout-eleve.scss'
})
export class AjoutEleve implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly eleveService = inject(EleveService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  ecoles: Ecole[] = [];
  communes: Commune[] = [];

  chargementReferentiels = false;
  enregistrementEnCours = false;

  successMessage = '';
  errorMessage = '';

  readonly formulaire = this.fb.group({
    nom: ['', [Validators.required, texteNonVide]],
    prenom: ['', [Validators.required, texteNonVide]],

    sexe: ['M', [
      Validators.required,
      Validators.pattern(/^[MF]$/)
    ]],

    numeroIne: [''],

    dateNaissance: [
      '',
      [Validators.required, dateNonFuture]
    ],

    dateNaissancePresumee: [false],

    classe: ['', [Validators.required, texteNonVide]],

    ecoleId: [null as number | null, Validators.required],

    communeNaissanceId: [
      null as number | null,
      Validators.required
    ],

    nomPere: [''],
    professionPere: [''],
    nomMere: [''],
    professionMere: ['']
  });

  ngOnInit(): void {
    this.chargerReferentiels();
  }

  chargerReferentiels(): void {
    this.chargementReferentiels = true;
    this.errorMessage = '';

    forkJoin({
      ecoles: this.eleveService.getEcoles(),
      communes: this.eleveService.getCommunes()
    }).subscribe({
      next: (data) => {
        this.ecoles = data.ecoles;
        this.communes = data.communes;

        this.chargementReferentiels = false;
        this.cdr.markForCheck();
      },

      error: () => {
        this.errorMessage =
          'Impossible de charger les écoles et les communes. Réessayez.';

        this.chargementReferentiels = false;
        this.cdr.markForCheck();
      }
    });
  }

  private obtenirMessageErreur(error: HttpErrorResponse): string {
  switch (error.status) {
    case 0:
      return 'Impossible de contacter le serveur. Vérifiez votre connexion.';

    case 400:
      return 'Les informations envoyées sont invalides. Vérifiez les champs du formulaire.';

    case 401:
      return 'Votre session a expiré. Veuillez vous reconnecter.';

    case 403:
      return 'Vous n’avez pas l’autorisation d’effectuer cette action.';

    case 404:
      return 'La ressource demandée est introuvable.';

    case 409:
      return 'Un conflit est survenu. Vérifiez si ce dossier existe déjà.';

    case 500:
      return 'Une erreur interne du serveur est survenue. Réessayez plus tard.';

    default:
      return 'Une erreur inattendue est survenue. Veuillez réessayer.';
  }
}

  enregistrerEleve(): void {

    if (
      this.chargementReferentiels ||
      this.enregistrementEnCours ||
      this.formulaire.invalid
    ) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enregistrementEnCours = true;
    this.successMessage = '';
    this.errorMessage = '';

    const valeurs = this.formulaire.getRawValue();

    const nouvelEleve: EleveRequest = {
      numeroIne: valeurs.numeroIne?.trim() || null,

      sexe: valeurs.sexe as 'M' | 'F',

      nom: valeurs.nom?.trim() ?? '',
      prenom: valeurs.prenom?.trim() ?? '',

      dateNaissance: valeurs.dateNaissance ?? '',

      dateNaissancePresumee:
        valeurs.dateNaissancePresumee ?? false,

      classe: valeurs.classe?.trim() ?? '',

      ecole: {
        id: valeurs.ecoleId!
      },

      communeNaissance: {
        id: valeurs.communeNaissanceId!
      },

      nomPere: valeurs.nomPere?.trim() || null,
      professionPere: valeurs.professionPere?.trim() || null,

      nomMere: valeurs.nomMere?.trim() || null,
      professionMere: valeurs.professionMere?.trim() || null
    };

    this.eleveService.create(nouvelEleve).subscribe({

      next: () => {
        this.enregistrementEnCours = false;

        this.successMessage =
          'Le dossier de l’élève a été créé avec succès.';

        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/eleves']);
        }, 1500);
      },

      error: (error: HttpErrorResponse) => {
        this.enregistrementEnCours = false;

        this.errorMessage = this.obtenirMessageErreur(error);

        this.cdr.markForCheck();
      }

    });
  }

  annuler(): void {
    this.router.navigate(['/eleves']);
  }
}
