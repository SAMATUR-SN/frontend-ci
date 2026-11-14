
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import { EleveService } from '../../../core/services/eleve.service';

@Component({
  selector: 'app-import-eleves',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './import-eleves.html',
  styleUrl: './import-eleves.scss'
})
export class ImportEleves {
  private readonly eleveService = inject(EleveService);

  protected fichier: File | null = null;
  protected nomFichier = '';
  protected apercu: string[][] = [];
  protected nombreLignes = 0;

  protected chargement = false;
  protected messageSucces = '';
  protected erreurs: string[] = [];
  protected erreurFichier = '';

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.reinitialiserMessages();

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.erreurFichier = 'Veuillez sélectionner un fichier CSV.';
      input.value = '';
      return;
    }

    if (file.size === 0) {
      this.erreurFichier = 'Le fichier sélectionné est vide.';
      input.value = '';
      return;
    }

    this.fichier = file;
    this.nomFichier = file.name;

    const reader = new FileReader();

    reader.onload = () => {
      const contenu = String(reader.result ?? '');
      const lignes = contenu
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .filter(ligne => ligne.trim() !== '');

      this.nombreLignes = Math.max(lignes.length - 1, 0);
      this.apercu = lignes.slice(0, 6).map(ligne =>
        this.parserLigneCsv(ligne)
      );
    };

    reader.onerror = () => {
      this.erreurFichier = 'Impossible de lire le fichier sélectionné.';
      this.fichier = null;
      this.apercu = [];
    };

    reader.readAsText(file, 'UTF-8');
  }

  private parserLigneCsv(ligne: string): string[] {
    const cellules: string[] = [];
    let valeur = '';
    let entreGuillemets = false;

    for (let i = 0; i < ligne.length; i++) {
      const caractere = ligne[i];

      if (caractere === '"') {
        if (entreGuillemets && ligne[i + 1] === '"') {
          valeur += '"';
          i++;
        } else {
          entreGuillemets = !entreGuillemets;
        }
      } else if (caractere === ';' && !entreGuillemets) {
        cellules.push(valeur.trim());
        valeur = '';
      } else {
        valeur += caractere;
      }
    }

    cellules.push(valeur.trim());
    return cellules;
  }

  
protected importer(): void {
  if (!this.fichier || this.chargement) {
    return;
  }

  this.reinitialiserMessages();
  this.chargement = true;

  this.eleveService.importerCsv(this.fichier)
    .pipe(
      finalize(() => {
        this.chargement = false;
      })
    )
    .subscribe({
      next: (reponse) => {
        this.messageSucces = reponse || 'Importation réussie avec succès !';

        this.fichier = null;
        this.nomFichier = '';
        this.apercu = [];
        this.nombreLignes = 0;
      },

      error: (erreur: HttpErrorResponse) => {
        const contenu = erreur.error;

        if (Array.isArray(contenu)) {
          this.erreurs = contenu.map(item => String(item));
        } else if (typeof contenu === 'string') {
          try {
            const analyse = JSON.parse(contenu);
            this.erreurs = Array.isArray(analyse)
              ? analyse.map(item => String(item))
              : [contenu];
          } catch {
            this.erreurs = [
              contenu || 'Une erreur est survenue pendant l’importation.'
            ];
          }
        } else {
          this.erreurs = [
            'Une erreur est survenue pendant l’importation.'
          ];
        }
      }
    });
}


  protected reinitialiserMessages(): void {
    this.messageSucces = '';
    this.erreurs = [];
    this.erreurFichier = '';
  }

  protected reinitialiser(): void {
    this.fichier = null;
    this.nomFichier = '';
    this.apercu = [];
    this.nombreLignes = 0;
    this.reinitialiserMessages();
  }
}
