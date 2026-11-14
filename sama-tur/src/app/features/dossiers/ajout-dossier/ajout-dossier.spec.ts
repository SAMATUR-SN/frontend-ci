import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AjoutDossier } from './ajout-dossier';

describe('AjoutDossier', () => {
  let component: AjoutDossier;
  let fixture: ComponentFixture<AjoutDossier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjoutDossier],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AjoutDossier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
