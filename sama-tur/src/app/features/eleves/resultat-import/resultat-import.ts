import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RapportImport } from '../../../core/models/rapport-import.model';
import { resumeRapport } from '../../../core/utils/csv-import';

/**
 * Le rapport d'un import : « N importés, M rejetés sur T lignes » et le tableau des lignes rejetées.
 * Un import où tout est rejeté (réimport d'un fichier déjà importé) est un avertissement, pas un succès.
 */
@Component({
  selector: 'app-resultat-import',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './resultat-import.html',
  styleUrl: './resultat-import.scss',
})
export class ResultatImport {
  readonly rapport = input.required<RapportImport>();
  readonly nouvelImport = output<void>();

  protected readonly resume = computed(() => resumeRapport(this.rapport()));
  protected readonly reussi = computed(
    () => this.rapport().rejetes === 0 && this.rapport().importes > 0,
  );
}
