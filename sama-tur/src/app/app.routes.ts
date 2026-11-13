
import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard/dashboard';
import { authGuard } from './core/guards/auth-guard';

import { TestApi } from './features/eleves/test-api/test-api';
import { ListeEleves } from './features/eleves/liste-eleves/liste-eleves';
import { DetailEleve } from './features/eleves/detail-eleve/detail-eleve';
import { AjoutEleve } from './features/eleves/ajout-eleve/ajout-eleve';
import { ImportEleves } from './features/eleves/import-eleves/import-eleves';

import { ListeDossiers } from './features/dossiers/liste-dossiers/liste-dossiers';
import { DetailDossier } from './features/dossiers/detail-dossier/detail-dossier';
import { AjoutDossier } from './features/dossiers/ajout-dossier/ajout-dossier';

import { ListeAlertes } from './features/alertes/liste-alertes/liste-alertes';

export const routes: Routes = [
  { path: 'login', component: Login },

  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  { path: 'test-api', component: TestApi },

  // Gestion des élèves : routes spécifiques avant :id
  { path: 'eleves', component: ListeEleves, canActivate: [authGuard] },

  { path: 'eleves/nouveau', component: AjoutEleve, canActivate: [authGuard] },

  { path: 'eleves/import', component: ImportEleves, canActivate: [authGuard] },

  { path: 'eleves/:id', component: DetailEleve, canActivate: [authGuard] },

  // Gestion des dossiers
  { path: 'dossiers', component: ListeDossiers, canActivate: [authGuard] },

  { path: 'dossiers/nouveau', component: AjoutDossier, canActivate: [authGuard] },

  { path: 'dossiers/:id', component: DetailDossier, canActivate: [authGuard] },

  // Gestion des alertes
  { path: 'alertes', component: ListeAlertes, canActivate: [authGuard] },

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: '**', redirectTo: 'login' }
];
