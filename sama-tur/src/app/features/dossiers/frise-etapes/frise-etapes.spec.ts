import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatutDossier } from '../../../core/models/dossier.model';
import { FriseEtapes } from './frise-etapes';

describe('FriseEtapes', () => {
  let fixture: ComponentFixture<FriseEtapes>;

  async function monter(etape: StatutDossier): Promise<void> {
    await TestBed.configureTestingModule({ imports: [FriseEtapes] }).compileComponents();
    fixture = TestBed.createComponent(FriseEtapes);
    fixture.componentRef.setInput('etape', etape);
    await fixture.whenStable();
  }

  const items = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('li'));
  const libelle = (li: Element) => li.querySelector('.libelle')?.textContent?.trim();

  it('affiche les six étapes dans l’ordre du parcours', async () => {
    await monter('DETECTE');

    expect(items().map(libelle)).toEqual([
      'Détecté',
      'Certificat obtenu',
      'Dossier complet',
      'Jugement rendu',
      'Transcrit',
      'Acte remis',
    ]);
  });

  it('marque les étapes franchies, l’étape courante et celles à venir', async () => {
    await monter('JUGEMENT_RENDU');

    expect(items().map((li) => li.className.trim())).toEqual([
      'etape faite',
      'etape faite',
      'etape faite',
      'etape courante',
      'etape',
      'etape',
    ]);
  });

  it('désigne une seule étape courante pour les technologies d’assistance', async () => {
    await monter('DOSSIER_COMPLET');

    const courantes = items().filter((li) => li.getAttribute('aria-current') === 'step');
    expect(courantes.length).toBe(1);
    expect(libelle(courantes[0])).toBe('Dossier complet');
  });

  it('ne repose pas sur la couleur seule : glyphe ✓ pour une étape franchie, numéro sinon', async () => {
    await monter('TRANSCRIT');

    const pastilles = items().map((li) => li.querySelector('.pastille')?.textContent?.trim());
    expect(pastilles).toEqual(['✓', '✓', '✓', '✓', '5', '6']);
    expect(items()[4].textContent).toContain('étape actuelle');
    expect(items()[0].textContent).toContain('étape franchie');
    expect(items()[5].textContent).toContain('à venir');
  });

  it('au premier stade, aucune étape n’est franchie', async () => {
    await monter('DETECTE');

    expect(items().filter((li) => li.classList.contains('faite')).length).toBe(0);
    expect(items()[0].classList.contains('courante')).toBe(true);
  });

  it('au dernier stade, cinq étapes sont franchies', async () => {
    await monter('ACTE_REMIS');

    expect(items().filter((li) => li.classList.contains('faite')).length).toBe(5);
    expect(items()[5].classList.contains('courante')).toBe(true);
  });
});
