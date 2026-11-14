
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EleveService } from '../../../core/services/eleve.service';
import { Eleve } from '../../../core/models/eleve.model';

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

  recherche = '';
  classeSelectionnee = '';
  ecoleSelectionnee = '';

  // Pagination
  pageActuelle = 1;
  elementsParPage = 5;

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

  // Résultats après recherche et filtrage
  get elevesFiltres(): Eleve[] {
    const terme = this.recherche.trim().toLowerCase();

    return this.eleves.filter(eleve => {
      const nomComplet =
        `${eleve.nom} ${eleve.prenom}`.toLowerCase();

      const ine = (eleve.numeroIne || '').toLowerCase();

      const correspondRecherche =
        !terme ||
        nomComplet.includes(terme) ||
        ine.includes(terme);

      const correspondClasse =
        !this.classeSelectionnee ||
        eleve.classe === this.classeSelectionnee;

      const correspondEcole =
        !this.ecoleSelectionnee ||
        String(eleve.ecole?.id) === this.ecoleSelectionnee;

      return correspondRecherche &&
        correspondClasse &&
        correspondEcole;
    });
  }

  // Nombre total de pages
  get nombrePages(): number {
    return Math.max(
      1,
      Math.ceil(this.elevesFiltres.length / this.elementsParPage)
    );
  }

  // Élèves affichés sur la page actuelle
  get elevesPagines(): Eleve[] {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;

    return this.elevesFiltres.slice(
      debut,
      debut + this.elementsParPage
    );
  }

  get debutResultats(): number {
    if (this.elevesFiltres.length === 0) {
      return 0;
    }

    return (this.pageActuelle - 1) * this.elementsParPage + 1;
  }

  get finResultats(): number {
    return Math.min(
      this.pageActuelle * this.elementsParPage,
      this.elevesFiltres.length
    );
  }

  ngOnInit(): void {
    this.chargerEleves();
  }

  chargerEleves(): void {
    this.loading = true;
    this.errorMessage = '';

    this.eleveService.getAll().subscribe({
      next: (data) => {
        this.eleves = data;
        this.pageActuelle = 1;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage =
          'Impossible de charger la liste des élèves.';

        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Recherche
  onRechercheChange(valeur: string): void {
    this.recherche = valeur;
    this.pageActuelle = 1;
  }

  // Filtre par classe
  onClasseChange(valeur: string): void {
    this.classeSelectionnee = valeur;
    this.pageActuelle = 1;
  }

  // Filtre par école
  onEcoleChange(valeur: string): void {
    this.ecoleSelectionnee = valeur;
    this.pageActuelle = 1;
  }

  // Changement du nombre d'élèves par page
  changerElementsParPage(valeur: string): void {
    this.elementsParPage = Number(valeur);
    this.pageActuelle = 1;
  }

  // Navigation
  pagePrecedente(): void {
    if (this.pageActuelle > 1) {
      this.pageActuelle--;
    }
  }

  pageSuivante(): void {
    if (this.pageActuelle < this.nombrePages) {
      this.pageActuelle++;
    }
  }

  allerAlaPage(page: number): void {
    if (page >= 1 && page <= this.nombrePages) {
      this.pageActuelle = page;
    }
  }

  // Numéros de pages
  get pagesDisponibles(): number[] {
    return Array.from(
      { length: this.nombrePages },
      (_, index) => index + 1
    );
  }

  reinitialiserFiltres(): void {
    this.recherche = '';
    this.classeSelectionnee = '';
    this.ecoleSelectionnee = '';
    this.pageActuelle = 1;
  }
}
