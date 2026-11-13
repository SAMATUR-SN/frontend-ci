
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EleveService } from '../../../core/services/eleve.service';
import { Eleve, EleveRequest } from '../../../core/models/eleve.model';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

// Refuse les champs contenant uniquement des espaces
function texteNonVide(
  control: AbstractControl
): ValidationErrors | null {
  if (typeof control.value !== 'string') {
    return null;
  }

  return control.value.trim().length > 0
    ? null
    : { texteVide: true };
}

// Empêche une date de naissance future
function dateNonFuture(
  control: AbstractControl
): ValidationErrors | null {
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
  selector: 'app-detail-eleve',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './detail-eleve.html',
  styleUrl: './detail-eleve.scss'
})
export class DetailEleve implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eleveService = inject(EleveService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly fb = inject(FormBuilder);

    modeModification = false;
    enregistrementEnCours = false;
    successMessage = '';
    suppressionEnCours = false;

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

      nomPere: [''],
      professionPere: [''],
      nomMere: [''],
      professionMere: ['']
    });

    private obtenirMessageErreur(
  error: HttpErrorResponse
): string {
  switch (error.status) {
    case 0:
      return 'Impossible de contacter le serveur. Vérifiez votre connexion.';

    case 400:
      return 'Les informations envoyées sont invalides. Vérifiez les champs du formulaire.';

    case 401:
      return 'Votre session a expiré. Veuillez vous reconnecter.';

    case 403:
      return 'Vous n’avez pas l’autorisation de modifier ce dossier.';

    case 404:
      return 'Le dossier de cet élève est introuvable.';

    case 409:
      return 'Un conflit est survenu. Vérifiez les informations du dossier.';

    case 500:
      return 'Une erreur interne du serveur est survenue. Réessayez plus tard.';

    default:
      return 'Une erreur inattendue est survenue. Veuillez réessayer.';
  }
}


activerModification(): void {
  if (!this.eleve) return;

  this.successMessage = '';

  this.formulaire.patchValue({
    nom: this.eleve.nom,
    prenom: this.eleve.prenom,
    sexe: this.eleve.sexe,
    numeroIne: this.eleve.numeroIne ?? '',
    dateNaissance: this.eleve.dateNaissance,
    dateNaissancePresumee: this.eleve.dateNaissancePresumee,
    classe: this.eleve.classe,
    nomPere: this.eleve.nomPere ?? '',
    professionPere: this.eleve.professionPere ?? '',
    nomMere: this.eleve.nomMere ?? '',
    professionMere: this.eleve.professionMere ?? ''
  });

  this.modeModification = true;
}


enregistrerModification(): void {
  if (
    !this.eleve ||
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

  const eleveModifie: EleveRequest = {
    numeroIne: valeurs.numeroIne?.trim() || null,

    sexe: valeurs.sexe as 'M' | 'F',

    nom: valeurs.nom?.trim() ?? '',
    prenom: valeurs.prenom?.trim() ?? '',

    dateNaissance: valeurs.dateNaissance ?? '',

    dateNaissancePresumee:
      valeurs.dateNaissancePresumee ?? false,

    classe: valeurs.classe?.trim() ?? '',

    ecole: {
      id: this.eleve.ecole.id
    },

    communeNaissance: {
      id: this.eleve.communeNaissance.id
    },

    nomPere: valeurs.nomPere?.trim() || null,
    professionPere: valeurs.professionPere?.trim() || null,

    nomMere: valeurs.nomMere?.trim() || null,
    professionMere: valeurs.professionMere?.trim() || null
  };

  this.eleveService.update(
    this.eleve.id,
    eleveModifie
  ).subscribe({

    next: (data) => {
      this.eleve = data;

      this.enregistrementEnCours = false;
      this.modeModification = false;

      this.successMessage =
        'Le dossier de l’élève a été modifié avec succès.';

      this.cdr.detectChanges();
    },

    error: (error: HttpErrorResponse) => {
      console.error('Erreur de modification :', error);

      this.enregistrementEnCours = false;

      this.errorMessage = this.obtenirMessageErreur(error);

      this.cdr.markForCheck();
    }
  });
}


annulerModification(): void {
  this.modeModification = false;
  this.formulaire.reset();
  this.successMessage = '';
  this.errorMessage = '';
}

supprimerEleve(): void {
  if (!this.eleve || this.suppressionEnCours) {
    return;
  }

  const confirmation = window.confirm(
    `Voulez-vous vraiment supprimer le dossier de ${this.eleve.prenom} ${this.eleve.nom} ? Cette action est irréversible.`
  );

  if (!confirmation) {
    return;
  }

  this.suppressionEnCours = true;
  this.errorMessage = '';
  this.successMessage = '';

  this.eleveService.delete(this.eleve.id).subscribe({

    next: () => {
      this.suppressionEnCours = false;

      this.cdr.detectChanges();

      alert('Le dossier de l’élève a été supprimé avec succès.');

      this.router.navigate(['/eleves']);
    },

    error: (error: HttpErrorResponse) => {
      console.error('Erreur lors de la suppression :', error);

      this.suppressionEnCours = false;

      this.errorMessage = this.obtenirMessageErreur(error);

      this.cdr.markForCheck();
    }
  });
}

  eleve: Eleve | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Identifiant de l’élève invalide.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.chargerEleve(id);
  }

  chargerEleve(id: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.eleveService.getById(id).subscribe({
      next: (data) => {
        this.eleve = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dossier :', error);
        this.errorMessage = 'Impossible de charger le dossier de cet élève.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  retournerListe(): void {
    this.router.navigate(['/eleves']);
  }
}
