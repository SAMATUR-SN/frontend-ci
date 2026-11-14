import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AjoutDossier } from './ajout-dossier';

describe('AjoutDossier', () => {
  let component: AjoutDossier;
  let fixture: ComponentFixture<AjoutDossier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjoutDossier],
    }).compileComponents();

    fixture = TestBed.createComponent(AjoutDossier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
