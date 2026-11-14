import { FormControl } from '@angular/forms';

import { aujourdhui, construireRequete, derniereDate, validerDate } from './avancement';

describe('construireRequete', () => {
  it('CERTIFICAT_OBTENU : numéro, date et centre, rien d’autre', () => {
    const requete = construireRequete('CERTIFICAT_OBTENU', {
      numeroCertificat: ' CERT-001 ',
      dateCertificat: '2026-11-03',
      centreEtatCivilId: '4',
      // Champs d'autres étapes qui traînent : ils ne doivent pas partir.
      numeroJugement: 'JUG-9',
      dateRemise: '2026-11-10',
    });

    expect(requete).toEqual({
      etapeCible: 'CERTIFICAT_OBTENU',
      numeroCertificat: 'CERT-001',
      dateCertificat: '2026-11-03',
      centreEtatCivilId: 4,
    });
  });

  it('DOSSIER_COMPLET avec TEMOINS : la preuve et exactement les deux témoins', () => {
    const requete = construireRequete('DOSSIER_COMPLET', {
      preuveNaissance: 'TEMOINS',
      temoins: [
        { nomComplet: ' Témoin Un ', numeroPiece: 'P-1' },
        { nomComplet: 'Témoin Deux', numeroPiece: 'P-2' },
      ],
    });

    expect(requete).toEqual({
      etapeCible: 'DOSSIER_COMPLET',
      preuveNaissance: 'TEMOINS',
      temoins: [
        { nomComplet: 'Témoin Un', numeroPiece: 'P-1' },
        { nomComplet: 'Témoin Deux', numeroPiece: 'P-2' },
      ],
    });
  });

  it('DOSSIER_COMPLET avec CERTIFICAT_ACCOUCHEMENT : aucun témoin, même s’il en reste dans le formulaire', () => {
    const requete = construireRequete('DOSSIER_COMPLET', {
      preuveNaissance: 'CERTIFICAT_ACCOUCHEMENT',
      temoins: [{ nomComplet: 'Reste du choix précédent', numeroPiece: 'P-1' }],
    });

    expect(requete).toEqual({
      etapeCible: 'DOSSIER_COMPLET',
      preuveNaissance: 'CERTIFICAT_ACCOUCHEMENT',
    });
    expect(requete).not.toHaveProperty('temoins');
  });

  it('JUGEMENT_RENDU : numéro, date, tribunal et type d’audience', () => {
    const requete = construireRequete('JUGEMENT_RENDU', {
      numeroJugement: 'JUG-12',
      dateJugement: '2026-11-05',
      tribunalId: '2',
      typeAudience: 'FORAINE',
    });

    expect(requete).toEqual({
      etapeCible: 'JUGEMENT_RENDU',
      numeroJugement: 'JUG-12',
      dateJugement: '2026-11-05',
      tribunalId: 2,
      typeAudience: 'FORAINE',
    });
  });

  it('TRANSCRIT : numéro d’acte, année entière et date', () => {
    const requete = construireRequete('TRANSCRIT', {
      numeroActe: 'ACTE-7',
      anneeActe: '2026',
      dateTranscription: '2026-11-08',
    });

    expect(requete).toEqual({
      etapeCible: 'TRANSCRIT',
      numeroActe: 'ACTE-7',
      anneeActe: 2026,
      dateTranscription: '2026-11-08',
    });
    expect(typeof requete.anneeActe).toBe('number');
  });

  it('ACTE_REMIS : la seule date de remise', () => {
    expect(construireRequete('ACTE_REMIS', { dateRemise: '2026-11-12' })).toEqual({
      etapeCible: 'ACTE_REMIS',
      dateRemise: '2026-11-12',
    });
  });

  it('joint le commentaire quand il est renseigné, et seulement alors', () => {
    expect(
      construireRequete('ACTE_REMIS', { dateRemise: '2026-11-12', commentaire: ' Remis ' }),
    ).toEqual({
      etapeCible: 'ACTE_REMIS',
      dateRemise: '2026-11-12',
      commentaire: 'Remis',
    });
    expect(
      construireRequete('ACTE_REMIS', { dateRemise: '2026-11-12', commentaire: '   ' }),
    ).not.toHaveProperty('commentaire');
  });

  it('n’envoie jamais de chaîne vide, de null ni de valeur absente', () => {
    const requete = construireRequete('JUGEMENT_RENDU', {
      numeroJugement: '',
      dateJugement: null,
      tribunalId: '',
      typeAudience: '',
      commentaire: '',
    });

    expect(requete).toEqual({ etapeCible: 'JUGEMENT_RENDU' });
    expect(Object.values(requete)).not.toContain('');
    expect(Object.values(requete)).not.toContain(null);
    expect(Object.values(requete)).not.toContain(undefined);
  });

  it('ignore une valeur numérique illisible', () => {
    expect(construireRequete('TRANSCRIT', { anneeActe: 'abc' })).not.toHaveProperty('anneeActe');
  });
});

describe('derniereDate', () => {
  const vide = {
    dateDetection: null,
    dateCertificat: null,
    dateJugement: null,
    dateTranscription: null,
    dateRemise: null,
  };

  it('rend la date la plus récente du dossier', () => {
    expect(
      derniereDate({ ...vide, dateDetection: '2026-09-01', dateCertificat: '2026-10-15' }),
    ).toBe('2026-10-15');
    expect(
      derniereDate({
        ...vide,
        dateDetection: '2026-09-01',
        dateCertificat: '2026-10-15',
        dateJugement: '2026-10-30',
        dateTranscription: '2026-11-02',
      }),
    ).toBe('2026-11-02');
  });

  it('rend null quand le dossier n’a aucune date', () => {
    expect(derniereDate(vide)).toBeNull();
  });
});

describe('aujourdhui', () => {
  it('écrit la date locale en AAAA-MM-JJ, avec zéros', () => {
    expect(aujourdhui(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(aujourdhui(new Date(2026, 10, 14, 0, 0))).toBe('2026-11-14');
  });
});

describe('validerDate', () => {
  const valider = (valeur: string, min: string | null = '2026-10-01', max = '2026-11-14') =>
    validerDate(min, max)(new FormControl(valeur));

  it('accepte une date comprise entre le minimum et aujourd’hui, bornes comprises', () => {
    expect(valider('2026-10-01')).toBeNull();
    expect(valider('2026-10-20')).toBeNull();
    expect(valider('2026-11-14')).toBeNull();
  });

  it('refuse une date antérieure à la dernière date du dossier', () => {
    expect(valider('2026-09-30')).toEqual({ dateAvant: { min: '2026-10-01' } });
  });

  it('refuse une date dans le futur', () => {
    expect(valider('2026-11-15')).toEqual({ dateFuture: { max: '2026-11-14' } });
  });

  it('n’a pas de minimum quand le dossier n’a aucune date', () => {
    expect(valider('2000-01-01', null)).toBeNull();
  });

  it('refuse un format qui n’est pas AAAA-MM-JJ', () => {
    expect(valider('14/11/2026')).toEqual({ dateInvalide: true });
  });

  it('laisse la valeur vide à Validators.required', () => {
    expect(valider('')).toBeNull();
  });
});
