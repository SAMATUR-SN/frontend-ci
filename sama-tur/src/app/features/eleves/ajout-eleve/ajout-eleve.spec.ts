import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AjoutEleve } from './ajout-eleve';

describe('AjoutEleve', () => {
  let component: AjoutEleve;
  let fixture: ComponentFixture<AjoutEleve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjoutEleve],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AjoutEleve);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
