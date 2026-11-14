import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { Ecole, Option } from '../models/referentiel.model';

/**
 * Listes de référence (communes, écoles, centres, tribunaux). Chaque liste est demandée une seule fois par session :
 * les abonnés suivants reçoivent la réponse mémorisée. Une erreur n'est pas mémorisée, le
 * prochain abonné relance l'appel.
 */
@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  private readonly http = inject(HttpClient);

  private readonly communes$ = this.http
    .get<Option[]>('/api/referentiels/communes')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  private readonly ecoles$ = this.http
    .get<Ecole[]>('/api/referentiels/ecoles')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  private readonly centres$ = this.http
    .get<Option[]>('/api/referentiels/centres')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  private readonly tribunaux$ = this.http
    .get<Option[]>('/api/referentiels/tribunaux')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  communes(): Observable<Option[]> {
    return this.communes$;
  }

  /** Centres d'état civil. */
  centres(): Observable<Option[]> {
    return this.centres$;
  }

  tribunaux(): Observable<Option[]> {
    return this.tribunaux$;
  }

  ecoles(): Observable<Ecole[]> {
    return this.ecoles$;
  }
}
