import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { DetailEleve } from './detail-eleve';

describe('DetailEleve', () => {
  let http: HttpTestingController;
  let traces: ReturnType<typeof vi.spyOn>[];

  function creer(id: string) {
    TestBed.configureTestingModule({
      imports: [DetailEleve],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    traces = (['log', 'error', 'warn'] as const).map((niveau) =>
      vi.spyOn(console, niveau).mockImplementation(() => {}),
    );
    const fixture = TestBed.createComponent(DetailEleve);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it("refuse un identifiant invalide sans appeler l'API", () => {
    const fixture = creer('abc');

    http.expectNone('/api/eleves/NaN');
    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.errorMessage).toBe('Identifiant de l’élève invalide.');
  });

  it("demande l'élève désigné par l'adresse", () => {
    creer('7');

    const requete = http.expectOne('/api/eleves/7');
    expect(requete.request.method).toBe('GET');
    requete.flush({}, { status: 404, statusText: 'Not Found' });
  });

  it("affiche un message quand le dossier n'est pas chargé, sans rien écrire dans la console", async () => {
    const fixture = creer('7');

    http
      .expectOne('/api/eleves/7')
      .flush({ detail: 'donnée sensible du serveur' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger le dossier de cet élève.');
    expect(fixture.nativeElement.textContent).not.toContain('donnée sensible du serveur');
    for (const trace of traces) {
      expect(trace).not.toHaveBeenCalled();
    }
  });
});
