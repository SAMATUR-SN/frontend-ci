import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DetailEleve } from './detail-eleve';

describe('DetailEleve', () => {
  let component: DetailEleve;
  let fixture: ComponentFixture<DetailEleve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailEleve],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailEleve);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
