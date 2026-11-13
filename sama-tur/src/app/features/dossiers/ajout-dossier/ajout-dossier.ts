import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { EleveService } from '../../../core/services/eleve.service';
import { DossierService } from '../../../core/services/dossier';
import { Eleve } from '../../../core/models/eleve.model';

@Component({
  selector: 'app-ajout-dossier',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './ajout-dossier.html',
  styleUrl: './ajout-dossier.scss'
})
export class AjoutDossier implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eleveService = inject(EleveService);
  private readonly dossierService = inject(DossierService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  eleves: Eleve[] = [];
  chargementEleves = false;
  soumissionEnCours = false;
  messageErreur = '';
  messageSucces = '';

  formulaire = this.fb.group({
    reference: ['', [Validators.required, Validators.maxLength(100)]],
    eleveId: ['', Validators.required]
  });

  ngOnInit(): void {
    this.chargerEleves();
  }

  chargerEleves(): void {
    this.chargementEleves = true;
    this.messageErreur = '';

    this.eleveService.getAll().subscribe({
      next: (eleves) => {
        this.eleves = eleves;
        this.chargementEleves = false;
        this.cdr.markForCheck();
      },
      error: (erreur) => {
        console.error('Erreur chargement élèves :', erreur);
        this.messageErreur = 'Impossible de charger les élèves. Vérifiez le serveur.';
        this.chargementEleves = false;
        this.cdr.markForCheck();
      }
    });
  }

  creerDossier(): void {
    this.messageErreur = '';
    this.messageSucces = '';

    if (this.formulaire.invalid || this.soumissionEnCours) {
      this.formulaire.markAllAsTouched();
      return;
    }

    const reference = this.formulaire.value.reference?.trim();
    const eleveId = Number(this.formulaire.value.eleveId);

    if (!reference || !Number.isInteger(eleveId) || eleveId <= 0) {
      this.messageErreur = 'Veuillez renseigner une référence et sélectionner un élève.';
      return;
    }

    this.soumissionEnCours = true;

    this.dossierService.create({ reference, eleveId }).subscribe({
      next: (dossier) => {
        this.messageSucces = 'Le dossier a été créé avec succès.';
        this.soumissionEnCours = false;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.router.navigate(['/dossiers', dossier.id]);
        }, 1000);
      },
      error: (erreur) => {
        console.error('Erreur création dossier :', erreur);

        this.messageErreur =
          erreur.status === 0
            ? 'Serveur inaccessible. Vérifiez que le backend fonctionne.'
            : erreur.status === 400
              ? 'Les informations envoyées sont invalides.'
              : erreur.status === 401
                ? 'Votre session a expiré. Reconnectez-vous.'
                : erreur.status === 403
                  ? 'Votre rôle ne permet pas de créer un dossier.'
                  : erreur.status === 409
                    ? 'Cette référence ou cet élève possède peut-être déjà un dossier.'
                    : 'Une erreur est survenue lors de la création du dossier.';

        this.soumissionEnCours = false;
        this.cdr.markForCheck();
      }
    });
  }
}