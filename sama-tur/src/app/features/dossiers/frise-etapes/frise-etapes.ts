import { Component, computed, input } from '@angular/core';

import { ETAPES, StatutDossier } from '../../../core/models/dossier.model';
import { libelleEtape, rangEtape } from '../../../core/utils/etapes';

/** Les six étapes du parcours ; celles déjà franchies et l'étape courante sont signalées. */
@Component({
  selector: 'app-frise-etapes',
  standalone: true,
  templateUrl: './frise-etapes.html',
  styleUrl: './frise-etapes.scss',
})
export class FriseEtapes {
  readonly etape = input.required<StatutDossier>();

  protected readonly etapes = ETAPES.map((code) => ({ code, libelle: libelleEtape(code) }));
  protected readonly rangCourant = computed(() => rangEtape(this.etape()));
}
