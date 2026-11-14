
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { routes } from './app.routes';

// Interface en français : virgule décimale et espace des milliers dans les pipes de nombre.
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    { provide: LOCALE_ID, useValue: 'fr' },
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    )
  ]
};
