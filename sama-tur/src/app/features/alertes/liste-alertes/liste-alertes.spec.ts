import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ListeAlertes } from './liste-alertes';

describe('ListeAlertes', () => {
  let component: ListeAlertes;
  let fixture: ComponentFixture<ListeAlertes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeAlertes],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListeAlertes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
