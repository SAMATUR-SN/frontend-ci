import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AlerteService } from './alerte';

describe('AlerteService', () => {
  let service: AlerteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AlerteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
