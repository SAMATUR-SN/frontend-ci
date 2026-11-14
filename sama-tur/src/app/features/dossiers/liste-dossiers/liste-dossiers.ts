
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DossierService } from '../../../core/services/dossier';
import { Dossier } from '../../../core/models/dossier.model';

@Component({
  selector: 'app-liste-dossiers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './liste-dossiers.html',
  styleUrl: './liste-dossiers.scss'
})
export class ListeDossiers implements OnInit {

  private readonly dossierService = inject(DossierService);
  private readonly cdr = inject(ChangeDetectorRef);

  dossiers: Dossier[] = [];

  chargement = false;
  messageErreur = '';

  ngOnInit(): void {
    this.chargerDossiers();
  }

  chargerDossiers(): void {
    this.chargement = true;
    this.messageErreur = '';

    this.dossierService.getAll().subscribe({
      next: (resultats) => {
        this.dossiers = resultats;
        this.chargement = false;
        this.cdr.markForCheck();
      },
      error: (erreur) => {
        console.error('Erreur lors du chargement des dossiers :', erreur);

        this.messageErreur =
          erreur.status === 401
            ? 'Votre session a expiré ou vous devez vous connecter.'
            : 'Impossible de charger les dossiers. Vérifiez la connexion au serveur.';

        this.chargement = false;
        this.cdr.markForCheck();
      }
    });
  }
}
