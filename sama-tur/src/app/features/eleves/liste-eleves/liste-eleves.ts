import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EleveService } from '../../../core/services/eleve.service';
import { Eleve } from '../../../core/models/eleve.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-liste-eleves',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './liste-eleves.html',
  styleUrl: './liste-eleves.scss'
})
export class ListeEleves implements OnInit {

  private readonly eleveService = inject(EleveService);
  private readonly cdr = inject(ChangeDetectorRef);

  eleves: Eleve[] = [];
  loading = true;
  errorMessage = '';
  ecoleSelectionnee = '';

  recherche = '';
  classeSelectionnee = '';

    get ecolesDisponibles(): Eleve['ecole'][] {
    const ecoles = new Map<number, Eleve['ecole']>();

    this.eleves.forEach(eleve => {
      if (eleve.ecole) {
        ecoles.set(eleve.ecole.id, eleve.ecole);
      }
    });

    return Array.from(ecoles.values()).sort(
      (a, b) => a.nom.localeCompare(b.nom)
    );
  }

  get classesDisponibles(): string[] {
    return [...new Set(this.eleves.map(e => e.classe))]
      .filter(Boolean)
      .sort();
  }

  get elevesFiltres(): Eleve[] {
    const terme = this.recherche.trim().toLowerCase();

    return this.eleves.filter(eleve => {
      const nomComplet = `${eleve.nom} ${eleve.prenom}`.toLowerCase();

      const correspondRecherche =
        !terme || nomComplet.includes(terme);

      const correspondClasse =
        !this.classeSelectionnee ||
        eleve.classe === this.classeSelectionnee;
      
      const correspondEcole =
        !this.ecoleSelectionnee ||
        String(eleve.ecole?.id) === this.ecoleSelectionnee;

      return correspondRecherche && correspondClasse &&
       correspondEcole;
    });
  }

  ngOnInit(): void {
    console.log('COMPOSANT LISTE-ELEVES INITIALISÉ');
    this.chargerEleves();
  }

  chargerEleves(): void {
  this.loading = true;
  this.errorMessage = '';
  

  console.log('1. Début du chargement des élèves');

  this.eleveService.getAll().subscribe({
    next: (data) => {
      console.log('2. Réponse reçue :', data);
      console.log('3. Nombre d’élèves :', data.length);

      this.eleves = data;
      this.loading = false;
      this.cdr.markForCheck();

      console.log('4. Chargement terminé :', this.loading);
    },
    error: (error) => {
      console.error('Erreur API :', error);

      this.errorMessage = 'Impossible de charger la liste des élèves.';
      this.loading = false;
      this.cdr.markForCheck();
    },
    complete: () => {
      console.log('5. Requête terminée');
    }
  });
}

reinitialiserFiltres(): void {
  this.recherche = '';
  this.classeSelectionnee = '';
  this.ecoleSelectionnee = '';
}
}