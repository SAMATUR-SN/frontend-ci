import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportEleves } from './import-eleves';

describe('ImportEleves', () => {
  let component: ImportEleves;
  let fixture: ComponentFixture<ImportEleves>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportEleves],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportEleves);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
