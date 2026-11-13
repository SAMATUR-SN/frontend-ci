import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlerteService } from '../../../core/services/alerte';
import { Alerte } from '../../../core/models/alerte.model';

@Component({
  selector: 'app-liste-alertes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './liste-alertes.html',
  styleUrl: './liste-alertes.scss'
})
export class ListeAlertes implements OnInit {
  private readonly alerteService = inject(AlerteService);
  private readonly cdr = inject(ChangeDetectorRef);

  alertes: Alerte[] = [];
  chargement = false;
  verificationEnCours = false;
  resolutionEnCours: number | null = null;

  messageErreur = '';
  messageSucces = '';

  get alertesNonResolues(): number {
    return this.alertes.filter(a => !a.resolue).length;
  }

  ngOnInit(): void {
    this.chargerAlertes();
  }

  chargerAlertes(): void {
    this.chargement = true;
    this.messageErreur = '';

    this.alerteService.getAll().subscribe({
      next: (resultats) => {
        this.alertes = resultats;
        this.chargement = false;
        this.cdr.markForCheck();
      },
      error: (erreur) => {
        console.error('Erreur chargement alertes :', erreur);
        this.messageErreur =
          erreur.status === 401
            ? 'Votre session a expiré.'
            : 'Impossible de charger les alertes.';

        this.chargement = false;
        this.cdr.markForCheck();
      }
    });
  }

  verifierAlertes(): void {
    if (this.verificationEnCours) return;

    this.verificationEnCours = true;
    this.messageErreur = '';
    this.messageSucces = '';

    this.alerteService.verifier().subscribe({
      next: (message) => {
        this.messageSucces =
          message || 'Vérification des retards effectuée.';
        this.verificationEnCours = false;
        this.chargerAlertes();
        this.cdr.markForCheck();
      },
      error: (erreur) => {
        console.error('Erreur vérification :', erreur);
        this.messageErreur =
          erreur.status === 403
            ? 'Votre rôle ne permet pas de vérifier les alertes.'
            : 'Impossible de lancer la vérification.';

        this.verificationEnCours = false;
        this.cdr.markForCheck();
      }
    });
  }

  resoudreAlerte(alerte: Alerte): void {
    if (alerte.resolue || this.resolutionEnCours !== null) return;

    if (!confirm('Confirmer la résolution de cette alerte ?')) return;

    this.resolutionEnCours = alerte.id;
    this.messageErreur = '';
    this.messageSucces = '';

    this.alerteService.resoudre(alerte.id).subscribe({
      next: (alerteActualisee) => {
        this.alertes = this.alertes.map(a =>
          a.id === alerteActualisee.id ? alerteActualisee : a
        );

        this.messageSucces = 'Alerte résolue avec succès.';
        this.resolutionEnCours = null;
        this.cdr.markForCheck();
      },
      error: (erreur) => {
        console.error('Erreur résolution :', erreur);
        this.messageErreur =
          erreur.status === 403
            ? 'Votre rôle ne permet pas de résoudre cette alerte.'
            : erreur.status === 404
              ? 'Cette alerte est introuvable.'
              : 'Impossible de résoudre cette alerte.';

        this.resolutionEnCours = null;
        this.cdr.markForCheck();
      }
    });
  }
}