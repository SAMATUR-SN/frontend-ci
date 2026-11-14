import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DossierDetail } from '../../../core/models/dossier.model';
import { DossierService } from '../../../core/services/dossier';
import { formaterDate, formaterDateHeure } from '../../../core/utils/dates';
import { libelleEtape, rangEtape } from '../../../core/utils/etapes';
import { libelleAudience, libellePreuve, libelleSexe } from '../../../core/utils/libelles';
import { extraireProbleme } from '../../../core/utils/probleme';
import { libelleRoleHistorique } from '../../../core/utils/roles';
import { AvancementDossier } from '../avancement-dossier/avancement-dossier';
import { FriseEtapes } from '../frise-etapes/frise-etapes';

/** Rang à partir duquel chaque bloc de données existe : un bloc par étape franchie. */
const RANG_CERTIFICAT = 1;
const RANG_PREUVE = 2;
const RANG_JUGEMENT = 3;
const RANG_TRANSCRIPTION = 4;
const RANG_REMISE = 5;

function messagePourStatut(status: number): string {
  if (status === 404) {
    return 'Ce dossier est introuvable : il a peut-être été archivé.';
  }
  if (status === 403) {
    return 'Votre rôle ne permet pas de consulter ce dossier.';
  }
  if (status === 0) {
    return 'Serveur injoignable. Vérifiez la connexion, puis réessayez.';
  }
  return 'Impossible de charger les informations du dossier.';
}

@Component({
  selector: 'app-detail-dossier',
  standalone: true,
  imports: [RouterLink, FriseEtapes, AvancementDossier],
  templateUrl: './detail-dossier.html',
  styleUrl: './detail-dossier.scss',
})
export class DetailDossier {
  private readonly dossierService = inject(DossierService);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly idValide = Number.isInteger(this.id) && this.id > 0;

  protected readonly dossier = signal<DossierDetail | null>(null);
  protected readonly chargement = signal(false);
  protected readonly messageErreur = signal('');

  protected readonly rang = computed(() => {
    const dossier = this.dossier();
    return dossier ? rangEtape(dossier.etape) : -1;
  });
  protected readonly aCertificat = computed(() => this.rang() >= RANG_CERTIFICAT);
  protected readonly aPreuve = computed(() => this.rang() >= RANG_PREUVE);
  protected readonly aJugement = computed(() => this.rang() >= RANG_JUGEMENT);
  protected readonly aTranscription = computed(() => this.rang() >= RANG_TRANSCRIPTION);
  protected readonly aRemise = computed(() => this.rang() >= RANG_REMISE);

  protected readonly libelleEtape = libelleEtape;
  protected readonly libellePreuve = libellePreuve;
  protected readonly libelleAudience = libelleAudience;
  protected readonly libelleSexe = libelleSexe;
  protected readonly libelleRole = libelleRoleHistorique;
  protected readonly formaterDate = formaterDate;
  protected readonly formaterDateHeure = formaterDateHeure;

  constructor() {
    if (!this.idValide) {
      this.messageErreur.set('Identifiant du dossier invalide.');
      return;
    }

    this.charger();
  }

  /** Une seule requête : l'historique est dans le détail. */
  protected charger(): void {
    this.chargement.set(true);
    this.messageErreur.set('');

    this.dossierService.trouver(this.id).subscribe({
      next: (dossier) => {
        this.dossier.set(dossier);
        this.chargement.set(false);
      },
      error: (erreur) => {
        this.messageErreur.set(messagePourStatut(extraireProbleme(erreur).status));
        this.chargement.set(false);
      },
    });
  }

  /** La réponse complète du backend remplace le dossier affiché. */
  protected remplacer(dossier: DossierDetail): void {
    this.dossier.set(dossier);
  }
}
