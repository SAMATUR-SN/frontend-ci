import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AjoutEleve } from './ajout-eleve';

describe('AjoutEleve', () => {
  let component: AjoutEleve;
  let fixture: ComponentFixture<AjoutEleve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjoutEleve],
    }).compileComponents();

    fixture = TestBed.createComponent(AjoutEleve);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
