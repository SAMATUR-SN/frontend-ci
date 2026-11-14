import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ListeEleves } from './liste-eleves';

describe('ListeEleves', () => {
  let component: ListeEleves;
  let fixture: ComponentFixture<ListeEleves>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeEleves],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListeEleves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
