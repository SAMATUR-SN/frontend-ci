import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DossierService } from './dossier';

describe('DossierService', () => {
  let service: DossierService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DossierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
