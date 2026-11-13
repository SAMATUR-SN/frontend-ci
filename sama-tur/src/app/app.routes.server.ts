
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Client
  },
  {
    path: 'test-api',
    renderMode: RenderMode.Client
  },
  {
    path: 'eleves',
    renderMode: RenderMode.Client
  },
  {
    path: 'eleves/nouveau',
    renderMode: RenderMode.Client
  },
  {
    path: 'eleves/import',
    renderMode: RenderMode.Client
  },
  {
    path: 'eleves/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'dossiers',
    renderMode: RenderMode.Client
  },
  {
    path: 'dossiers/nouveau',
    renderMode: RenderMode.Client
  },
  {
    path: 'dossiers/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'alertes',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
