
import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard/dashboard';

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { ROLES_ALERTES, ROLES_IMPORT } from './core/utils/acces';

import { TestApi } from './features/eleves/test-api/test-api';

import { ListeEleves } from './features/eleves/liste-eleves/liste-eleves';
import { DetailEleve } from './features/eleves/detail-eleve/detail-eleve';
import { AjoutEleve } from './features/eleves/ajout-eleve/ajout-eleve';
import { ImportEleves } from './features/eleves/import-eleves/import-eleves';

import { ListeDossiers } from './features/dossiers/liste-dossiers/liste-dossiers';

export const routes: Routes = [

  // AUTHENTIFICATION
  {
    path: 'login',
    component: Login
  },

  // DASHBOARD
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },

  // ROUTE DE TEST
  {
    path: 'test-api',
    component: TestApi,
    canActivate: [authGuard]
  },

  // GESTION DES ELEVES
  {
    path: 'eleves',
    component: ListeEleves,
    canActivate: [authGuard]
  },

  // Ajouter un élève : ECOLE
  {
    path: 'eleves/nouveau',
    component: AjoutEleve,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ECOLE']
    }
  },

  // Importer les élèves : ECOLE
  {
    path: 'eleves/import',
    component: ImportEleves,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ROLES_IMPORT
    }
  },

  {
    path: 'eleves/:id',
    component: DetailEleve,
    canActivate: [authGuard]
  },

  // GESTION DES DOSSIERS
  {
    path: 'dossiers',
    component: ListeDossiers,
    canActivate: [authGuard]
  },

  {
    path: 'dossiers/:id',
    // Chargée à la demande : la fiche et son formulaire n'alourdissent pas le bundle initial.
    loadComponent: () =>
      import('./features/dossiers/detail-dossier/detail-dossier').then((m) => m.DetailDossier),
    canActivate: [authGuard]
  },

  // GESTION DES ALERTES
  {
    path: 'alertes',
    loadComponent: () =>
      import('./features/alertes/liste-alertes/liste-alertes').then((m) => m.ListeAlertes),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ROLES_ALERTES
    }
  },

  // REDIRECTIONS
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];
