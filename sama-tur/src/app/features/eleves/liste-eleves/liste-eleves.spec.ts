import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ListeEleves } from './liste-eleves';

describe('ListeEleves', () => {
  let http: HttpTestingController;
  let traces: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListeEleves],
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

  it('charge la liste des élèves au démarrage', async () => {
    const fixture = TestBed.createComponent(ListeEleves);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading).toBe(true);

    const requete = http.expectOne('/api/eleves');
    expect(requete.request.method).toBe('GET');
    requete.flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.errorMessage).toBe('');
  });

  it('affiche un message quand la liste est refusée, sans rien écrire dans la console', async () => {
    const fixture = TestBed.createComponent(ListeEleves);
    fixture.detectChanges();

    http
      .expectOne('/api/eleves')
      .flush({ detail: 'donnée sensible du serveur' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger la liste des élèves.');
    expect(fixture.nativeElement.textContent).not.toContain('donnée sensible du serveur');
    for (const trace of traces) {
      expect(trace).not.toHaveBeenCalled();
    }
  });
});
