
import {
  Component,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { EleveService } from '../../../core/services/eleve.service';
import { DossierService } from '../../../core/services/dossier';
import { AlerteService } from '../../../core/services/alerte';

import { Eleve } from '../../../core/models/eleve.model';
import { Dossier, StatutDossier } from '../../../core/models/dossier.model';
import { Alerte } from '../../../core/models/alerte.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly eleveService = inject(EleveService);
  private readonly dossierService = inject(DossierService);
  private readonly alerteService = inject(AlerteService);

  private readonly cdr = inject(ChangeDetectorRef);

  protected nombreEleves = 0;
  protected nombreDossiers = 0;
  protected nombreAlertes = 0;

  protected dossiersRecents: Dossier[] = [];

  protected loading = false;
  protected erreurChargement = false;

  protected readonly dateDuJour = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  constructor() {
    this.chargerDonnees();
  }

  protected chargerDonnees(): void {

    this.loading = true;
    this.erreurChargement = false;

    forkJoin({

      // Récupération des élèves
      eleves: this.eleveService.getAll().pipe(
        tap({
          next: data => console.log('ÉLÈVES : réponse reçue', data),
          complete: () => console.log('ÉLÈVES : terminé')
        }),
        catchError(erreur => {
          console.error('ÉLÈVES : erreur', erreur);
          this.erreurChargement = true;
          return of([] as Eleve[]);
        }),
        finalize(() => console.log('ÉLÈVES : flux fermé'))
      ),

      // Récupération des dossiers
      dossiers: this.dossierService.getAll().pipe(
        tap({
          next: data => console.log('DOSSIERS : réponse reçue', data),
          complete: () => console.log('DOSSIERS : terminé')
        }),
        catchError(erreur => {
          console.error('DOSSIERS : erreur', erreur);
          this.erreurChargement = true;
          return of([] as Dossier[]);
        }),
        finalize(() => console.log('DOSSIERS : flux fermé'))
      ),

      // Récupération des alertes
      alertes: this.alerteService.getAll().pipe(
        tap({
          next: data => console.log('ALERTES : réponse reçue', data),
          complete: () => console.log('ALERTES : terminé')
        }),
        catchError(erreur => {
          console.error('ALERTES : erreur', erreur);
          this.erreurChargement = true;
          return of([] as Alerte[]);
        }),
        finalize(() => console.log('ALERTES : flux fermé'))
      )

    }).pipe(

      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })

    ).subscribe({

      next: (resultats) => {

        console.log('RÉSULTATS DASHBOARD :', resultats);

        this.nombreEleves = resultats.eleves.length;
        this.nombreDossiers = resultats.dossiers.length;
        this.nombreAlertes = resultats.alertes.length;

        this.dossiersRecents = resultats.dossiers.slice(0, 5);

        console.log('Nombre élèves :', this.nombreEleves);
        console.log('Nombre dossiers :', this.nombreDossiers);
        console.log('Nombre alertes :', this.nombreAlertes);

        this.cdr.markForCheck();
      },

      error: (erreur) => {
        console.error('Erreur générale Dashboard :', erreur);

        this.erreurChargement = true;
        this.cdr.markForCheck();
      }

    });
  }

  // Traduction des étapes des dossiers
  protected getStatutLabel(statut: StatutDossier): string {

    const labels: Record<StatutDossier, string> = {
      DETECTE: 'Détecté',
      CERTIFICAT_OBTENU: 'Certificat obtenu',
      CERTIFICAT_ETABLI: 'Certificat établi',
      DOSSIER_COMPLET: 'Dossier complet',
      JUGEMENT_RENDU: 'Jugement rendu',
      TRANSCRIT: 'Transcrit',
      ACTE_REMIS: 'Acte remis'
    };

    return labels[statut] ?? statut;
  }

  // Récupération du nom complet de l'élève
  protected getNomEleve(dossier: Dossier): string {

    return `${dossier.eleve?.prenom ?? ''} ${dossier.eleve?.nom ?? ''}`.trim()
      || 'Élève non renseigné';
  }

  // Formatage des dates
  protected formaterDate(date: string | null): string {

    if (!date) {
      return 'Non renseignée';
    }

    return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
  }

  // Déconnexion
  protected logout(): void {

    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
