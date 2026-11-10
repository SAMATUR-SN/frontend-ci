import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard/dashboard';
import { authGuard } from './core/guards/auth-guard';
import { TestApi } from './features/eleves/test-api/test-api';
import { ListeEleves } from './features/eleves/liste-eleves/liste-eleves';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
  path: 'eleves',
  component: ListeEleves,
  canActivate: [authGuard]
  },
  { path: 'test-api', component: TestApi },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];