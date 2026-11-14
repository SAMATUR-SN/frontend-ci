import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DetailDossier } from './detail-dossier';

describe('DetailDossier', () => {
  let component: DetailDossier;
  let fixture: ComponentFixture<DetailDossier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailDossier],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailDossier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
