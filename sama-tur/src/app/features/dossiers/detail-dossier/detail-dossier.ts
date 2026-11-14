
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DossierService } from '../../../core/services/dossier';
import { Dossier , HistoriqueDossier} from '../../../core/models/dossier.model';

@Component({
  selector: 'app-detail-dossier',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detail-dossier.html',
  styleUrl: './detail-dossier.scss'
})
export class DetailDossier implements OnInit {

  private readonly dossierService = inject(DossierService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  dossier: Dossier | null = null;
  chargement = false;
  messageErreur = '';
  avancementEnCours = false;
  messageSucces = '';
  historique: HistoriqueDossier[] = [];
  chargementHistorique = false;
  erreurHistorique = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.messageErreur = 'Identifiant du dossier invalide.';
      return;
    }

    this.chargerDossier(id);
  }

    avancerDossier(): void {
    if (!this.dossier || this.avancementEnCours) {
      return;
    }

    this.avancementEnCours = true;
    this.messageErreur = '';
    this.messageSucces = '';

    this.dossierService.avancerAncien(this.dossier.id).subscribe({
      next: (dossierActualise) => {
        this.dossier = dossierActualise;
        this.chargerHistorique(dossierActualise.id);
        this.messageSucces = 'Le dossier a avancé avec succès.';
        this.avancementEnCours = false;
        this.cdr.markForCheck();
      },
      error: (erreur) => {
        console.error('Erreur lors de l’avancement :', erreur);

        this.messageErreur =
          erreur.status === 401
            ? 'Votre session a expiré.'
            : erreur.status === 403
              ? 'Votre rôle ne permet pas de faire avancer ce dossier.'
              : erreur.status === 400
                ? 'Cette transition est impossible selon les règles du dossier.'
                : 'Impossible de faire avancer le dossier.';

        this.avancementEnCours = false;
        this.cdr.markForCheck();
      }
    });
  }
  

  chargerDossier(id: number): void {
    this.chargement = true;
    this.messageErreur = '';

    this.dossierService.getById(id).subscribe({
      next: (resultat) => {
        this.dossier = resultat;
        this.chargerHistorique(resultat.id);
        this.chargement = false;
        this.cdr.markForCheck();
      },
      error: (erreur) => {
        console.error('Erreur lors du chargement du dossier :', erreur);

        this.messageErreur =
          erreur.status === 404
            ? 'Ce dossier est introuvable.'
            : erreur.status === 401
              ? 'Votre session a expiré.'
              : 'Impossible de charger les informations du dossier.';

        this.chargement = false;
        this.cdr.markForCheck();
      }
      
    });
  }
  chargerHistorique(id: number): void {
  this.chargementHistorique = true;
  this.erreurHistorique = '';

  this.dossierService.getHistorique(id).subscribe({
    next: (resultats) => {
      this.historique = resultats;
      this.chargementHistorique = false;
      this.cdr.markForCheck();
    },
    error: (erreur) => {
      console.error('Erreur historique :', erreur);
      this.erreurHistorique =
        'Impossible de charger l’historique du dossier.';
      this.chargementHistorique = false;
      this.cdr.markForCheck();
    }
  });
}
}
