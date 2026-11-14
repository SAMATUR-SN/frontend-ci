
import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard/dashboard';

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

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
      roles: ['ECOLE']
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

  // Créer un dossier : ECOLE
  {
    path: 'dossiers/nouveau',
    component: AjoutDossier,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ECOLE']
    }
  },

  {
    path: 'dossiers/:id',
    component: DetailDossier,
    canActivate: [authGuard]
  },

  // GESTION DES ALERTES
  {
    path: 'alertes',
    component: ListeAlertes,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: [
        'ETAT_CIVIL',
        'TRIBUNAL',
        'SUPERVISEUR'
      ]
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
