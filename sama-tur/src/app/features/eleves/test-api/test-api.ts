import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EleveService } from '../../../core/services/eleve.service';
import { Eleve } from '../../../core/models/eleve.model';

@Component({
  selector: 'app-test-api',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Test de connexion à l'API des élèves</h2>

    <p *ngIf="loading">Chargement des élèves...</p>

    <p *ngIf="error" style="color: red">
      Erreur : {{ error }}
    </p>

    <p *ngIf="!loading && !error">
      Nombre d'élèves récupérés : {{ eleves.length }}
    </p>

    <ul>
      <li *ngFor="let eleve of eleves">
        {{ eleve.nom }} {{ eleve.prenom }}
      </li>
    </ul>
  `
})
export class TestApi implements OnInit {
  private readonly eleveService = inject(EleveService);

  eleves: Eleve[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.eleveService.getAll().subscribe({
      next: (data) => {
        this.eleves = data;
        this.loading = false;
        console.log('Élèves récupérés :', data);
      },
      error: (err) => {
        this.error = `Code HTTP ${err.status} — ${err.message}`;
        this.loading = false;
        console.error('Erreur API :', err);
      }
    });
  }
}