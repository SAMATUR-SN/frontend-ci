import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AjoutEleve } from './ajout-eleve';

describe('AjoutEleve', () => {
  let http: HttpTestingController;
  let traces: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AjoutEleve],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    traces = (['log', 'error', 'warn'] as const).map((niveau) =>
      vi.spyOn(console, niveau).mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('charge les écoles et les communes au démarrage', async () => {
    const fixture = TestBed.createComponent(AjoutEleve);
    fixture.detectChanges();
    expect(fixture.componentInstance.chargementReferentiels).toBe(true);

    http.expectOne('/api/referentiels/ecoles').flush([{ id: 1, nom: 'École A' }]);
    http.expectOne('/api/referentiels/communes').flush([{ id: 2, nom: 'Commune B' }]);
    await fixture.whenStable();

    expect(fixture.componentInstance.chargementReferentiels).toBe(false);
    expect(fixture.componentInstance.ecoles.length).toBe(1);
    expect(fixture.componentInstance.communes.length).toBe(1);
  });

  it('affiche un message quand un référentiel est refusé, sans rien écrire dans la console', async () => {
    const fixture = TestBed.createComponent(AjoutEleve);
    fixture.detectChanges();

    http.expectOne('/api/referentiels/ecoles').flush([]);
    http
      .expectOne('/api/referentiels/communes')
      .flush({ detail: 'donnée sensible du serveur' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.chargementReferentiels).toBe(false);
    expect(fixture.nativeElement.textContent).toContain(
      'Impossible de charger les écoles et les communes.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('donnée sensible du serveur');
    for (const trace of traces) {
      expect(trace).not.toHaveBeenCalled();
    }
  });
});
