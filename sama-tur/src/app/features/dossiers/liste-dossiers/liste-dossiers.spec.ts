import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ListeDossiers } from './liste-dossiers';

describe('ListeDossiers', () => {
  let component: ListeDossiers;
  let fixture: ComponentFixture<ListeDossiers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeDossiers],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListeDossiers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
