import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RapportImport } from '../../../core/models/rapport-import.model';
import { EleveService } from '../../../core/services/eleve.service';
import {
  COLONNES_OBLIGATOIRES,
  analyserCsv,
  modeleCsv,
  verifierContenu,
  verifierFichier,
} from '../../../core/utils/csv-import';
import { extraireProbleme, ProblemeExtrait } from '../../../core/utils/probleme';
import { ResultatImport } from '../resultat-import/resultat-import';

const NOM_MODELE = 'modele-import-eleves.csv';

/** Le message affiché pour un import refusé : le détail du serveur pour 400 et 422, sinon le nôtre. */
function messageRefus(probleme: ProblemeExtrait): string {
  switch (probleme.status) {
    case 400:
    case 422:
      return probleme.detail || 'Le fichier a été refusé par le serveur.';
    case 403:
      return 'Réservé aux directeurs d’école.';
    case 413:
      return 'Le fichier est trop volumineux : 2 Mo au maximum.';
    case 0:
      return 'Serveur injoignable. Vérifiez la connexion, puis réessayez.';
    default:
      return 'L’importation a échoué. Réessayez dans un instant.';
  }
}

function lireTexte(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result ?? ''));
    lecteur.onerror = () => reject(lecteur.error);
    lecteur.readAsText(fichier, 'UTF-8');
  });
}

@Component({
  selector: 'app-import-eleves',
  standalone: true,
  imports: [RouterLink, ResultatImport],
  templateUrl: './import-eleves.html',
  styleUrl: './import-eleves.scss',
})
export class ImportEleves {
  private readonly eleveService = inject(EleveService);
  private readonly document = inject(DOCUMENT);
  private readonly champ = viewChild<ElementRef<HTMLInputElement>>('champFichier');

  protected readonly colonnesObligatoires = COLONNES_OBLIGATOIRES.join(', ');

  protected readonly fichier = signal<File | null>(null);
  protected readonly apercu = signal<string[][]>([]);
  protected readonly nombreLignes = signal(0);
  /** Refus décidé ici, avant tout envoi. */
  protected readonly erreurFichier = signal('');
  /** Refus décidé par le serveur. */
  protected readonly erreurServeur = signal('');
  protected readonly rapport = signal<RapportImport | null>(null);
  protected readonly chargement = signal(false);

  /** Ignore la lecture d'un fichier choisi avant celui qui vient d'être sélectionné. */
  private lecture = 0;

  protected async choisirFichier(event: Event): Promise<void> {
    const champ = event.target as HTMLInputElement;
    const choisi = champ.files?.[0];
    const numero = ++this.lecture;

    this.viderMessages();
    this.retirerFichier();

    if (!choisi) {
      return;
    }

    const refus = verifierFichier(choisi.name, choisi.size);
    if (refus) {
      this.refuser(refus);
      return;
    }

    let contenu: string;
    try {
      contenu = await lireTexte(choisi);
    } catch {
      this.refuser('Impossible de lire le fichier sélectionné.');
      return;
    }

    if (numero !== this.lecture) {
      return;
    }

    const refusContenu = verifierContenu(contenu);
    if (refusContenu) {
      this.refuser(refusContenu);
      return;
    }

    const analyse = analyserCsv(contenu);
    this.apercu.set(analyse.lignes);
    this.nombreLignes.set(analyse.nombreLignes);
    this.fichier.set(choisi);
  }

  protected importer(): void {
    const fichier = this.fichier();
    if (!fichier || this.chargement()) {
      return;
    }

    this.viderMessages();
    this.chargement.set(true);

    this.eleveService.importerCsv(fichier).subscribe({
      next: (rapport) => {
        this.rapport.set(rapport);
        this.chargement.set(false);
        this.retirerFichier();
      },
      error: (erreur) => {
        this.erreurServeur.set(messageRefus(extraireProbleme(erreur)));
        this.chargement.set(false);
      },
    });
  }

  protected retirer(): void {
    this.lecture++;
    this.viderMessages();
    this.retirerFichier();
  }

  protected nouvelImport(): void {
    this.retirer();
  }

  /** Génère le modèle côté client : l'en-tête exact et une ligne d'exemple. */
  protected telechargerModele(): void {
    const blob = new Blob([modeleCsv()], { type: 'text/csv;charset=utf-8' });
    const adresse = URL.createObjectURL(blob);
    const lien = this.document.createElement('a');

    lien.href = adresse;
    lien.download = NOM_MODELE;
    lien.click();
    URL.revokeObjectURL(adresse);
  }

  private refuser(message: string): void {
    this.erreurFichier.set(message);
    this.viderChamp();
  }

  private viderMessages(): void {
    this.erreurFichier.set('');
    this.erreurServeur.set('');
    this.rapport.set(null);
  }

  private retirerFichier(): void {
    this.fichier.set(null);
    this.apercu.set([]);
    this.nombreLignes.set(0);
    this.viderChamp();
  }

  /** Sans cela, choisir de nouveau le même fichier ne déclenche aucun événement. */
  private viderChamp(): void {
    const champ = this.champ()?.nativeElement;
    if (champ) {
      champ.value = '';
    }
  }
}
