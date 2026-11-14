import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ImportEleves } from './import-eleves';

describe('ImportEleves', () => {
  let component: ImportEleves;
  let fixture: ComponentFixture<ImportEleves>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportEleves],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportEleves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
