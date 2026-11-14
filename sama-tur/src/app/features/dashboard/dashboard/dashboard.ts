
import {
  Component,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { TokenStorage } from '../../../core/services/token-storage';
import { EleveService } from '../../../core/services/eleve.service';
import { DossierService } from '../../../core/services/dossier';
import { AlerteService } from '../../../core/services/alerte';

import { Eleve } from '../../../core/models/eleve.model';
import { Dossier, StatutDossierAncien } from '../../../core/models/dossier.model';
import { Alerte } from '../../../core/models/alerte.model';
import { Role } from '../../../core/models/utilisateur.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  // Services
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly router = inject(Router);

  private readonly eleveService = inject(EleveService);
  private readonly dossierService = inject(DossierService);
  private readonly alerteService = inject(AlerteService);

  private readonly cdr = inject(ChangeDetectorRef);

  // Statistiques
  protected nombreEleves = 0;
  protected nombreDossiers = 0;
  protected nombreAlertes = 0;

  // Dossiers récents
  protected dossiersRecents: Dossier[] = [];

  // État du dashboard
  protected loading = false;
  protected erreurChargement = false;

  // Date actuelle
  protected readonly dateDuJour = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  
  // INFORMATIONS DE L'UTILISATEUR CONNECTÉ
  

  protected get nomUtilisateur(): string {
    return this.tokenStorage.getUtilisateur()?.nomAffiche ?? 'Utilisateur';
  }

  // Absente (null) pour le superviseur.
  protected get structureUtilisateur(): string | null {
    return this.tokenStorage.getUtilisateur()?.structure ?? null;
  }

  protected getRoleLabel(): string {

    const labels: Record<Role, string> = {
      ECOLE: 'École',
      ETAT_CIVIL: 'État civil',
      TRIBUNAL: 'Tribunal',
      SUPERVISEUR: 'Superviseur'
    };

    const role = this.tokenStorage.getRole();

    return role ? labels[role] : 'Rôle non défini';
  }

  protected hasAnyRole(rolesAutorises: Role[]): boolean {
    const role = this.tokenStorage.getRole();

    return role !== null && rolesAutorises.includes(role);
  }

  
  // GESTION DES AUTORISATIONS
  
  // Consultation des élèves
  protected get peutConsulterEleves(): boolean {
    return this.hasAnyRole([
      'ECOLE',
      'SUPERVISEUR'
    ]);
  }

  // Consultation des dossiers
  protected get peutConsulterDossiers(): boolean {
    return this.hasAnyRole([
      'ECOLE',
      'ETAT_CIVIL',
      'TRIBUNAL',
      'SUPERVISEUR'
    ]);
  }

  // Création d'un élève
  protected get peutCreerEleve(): boolean {
    return this.hasAnyRole([
      'ECOLE',
      'SUPERVISEUR'
    ]);
  }

  // Création d'un dossier
  protected get peutCreerDossier(): boolean {
    return this.hasAnyRole([
      'ECOLE',
      'SUPERVISEUR'
    ]);
  }

  // Consultation et gestion des alertes
  // Le backend autorise tout utilisateur authentifié.
  protected get peutGererAlertes(): boolean {
    return this.tokenStorage.getToken() !== null;
  }

 
  // INITIALISATION
  
  constructor() {
    this.chargerDonnees();
  }

  
  // CHARGEMENT DES DONNÉES DU DASHBOARD
  

  protected chargerDonnees(): void {

    this.loading = true;
    this.erreurChargement = false;

    // Récupération des élèves selon les permissions
    const requeteEleves = this.peutConsulterEleves
      ? this.eleveService.getAll().pipe(
          catchError(erreur => {
            console.error('Erreur chargement élèves :', erreur);
            this.erreurChargement = true;
            return of([] as Eleve[]);
          })
        )
      : of([] as Eleve[]);

    // Récupération des dossiers selon les permissions
    const requeteDossiers = this.peutConsulterDossiers
      ? this.dossierService.getAll().pipe(
          catchError(erreur => {
            console.error('Erreur chargement dossiers :', erreur);
            this.erreurChargement = true;
            return of([] as Dossier[]);
          })
        )
      : of([] as Dossier[]);

    // Les alertes sont accessibles à tout utilisateur authentifié
    const requeteAlertes = this.peutGererAlertes
      ? this.alerteService.getAll().pipe(
          catchError(erreur => {
            console.error('Erreur chargement alertes :', erreur);
            this.erreurChargement = true;
            return of([] as Alerte[]);
          })
        )
      : of([] as Alerte[]);

    // Exécution des trois requêtes
    forkJoin({

      eleves: requeteEleves,

      dossiers: requeteDossiers,

      alertes: requeteAlertes

    }).pipe(

      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })

    ).subscribe({

      next: resultats => {

        console.log('DONNÉES DU DASHBOARD :', resultats);

        this.nombreEleves = resultats.eleves.length;
        this.nombreDossiers = resultats.dossiers.length;
        this.nombreAlertes = resultats.alertes.length;

        this.dossiersRecents = resultats.dossiers.slice(0, 5);

        this.cdr.markForCheck();
      },

      error: erreur => {

        console.error('Erreur générale Dashboard :', erreur);

        this.erreurChargement = true;

        this.cdr.markForCheck();
      }

    });
  }

  
  // TRADUCTION DES STATUTS DES DOSSIERS
  

  protected getStatutLabel(statut: StatutDossierAncien): string {

    const labels: Record<StatutDossierAncien, string> = {
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

  
  // RÉCUPÉRATION DU NOM DE L'ÉLÈVE
  

  protected getNomEleve(dossier: Dossier): string {

    return `${dossier.eleve?.prenom ?? ''} ${dossier.eleve?.nom ?? ''}`.trim()
      || 'Élève non renseigné';
  }

  
  // FORMATAGE DES DATES
  

  protected formaterDate(date: string | null): string {

    if (!date) {
      return 'Non renseignée';
    }

    return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
  }

  
  // DÉCONNEXION
  

  protected logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);
  }

}
