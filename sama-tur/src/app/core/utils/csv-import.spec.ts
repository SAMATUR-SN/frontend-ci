import {
  COLONNES_MODELE,
  COLONNES_OBLIGATOIRES,
  LIGNES_MAX,
  TAILLE_MAX_OCTETS,
  analyserCsv,
  modeleCsv,
  parserLigneCsv,
  resumeRapport,
  verifierContenu,
  verifierFichier,
} from './csv-import';

const ENTETE = COLONNES_MODELE.join(';');
const LIGNE = 'Awa;Diouf;F;14/03/2014;non;Bambey;ECO-BAM-01;CM2;Mariama Sene;;;WOLOF;';

describe('parserLigneCsv', () => {
  it('découpe au point-virgule et retire les espaces autour des cellules', () => {
    expect(parserLigneCsv(' a ; b ;c')).toEqual(['a', 'b', 'c']);
  });

  it('garde les cellules vides', () => {
    expect(parserLigneCsv('a;;c;')).toEqual(['a', '', 'c', '']);
  });

  it('respecte les guillemets : un point-virgule entre guillemets ne sépare pas', () => {
    expect(parserLigneCsv('"Diouf; Awa";F')).toEqual(['Diouf; Awa', 'F']);
  });

  it('lit un guillemet doublé comme un guillemet', () => {
    expect(parserLigneCsv('"dit ""oui""";x')).toEqual(['dit "oui"', 'x']);
  });
});

describe('analyserCsv', () => {
  it('rend l’en-tête, cinq lignes de prévisualisation, et le nombre de lignes de données', () => {
    const contenu = [ENTETE, ...Array.from({ length: 8 }, () => LIGNE)].join('\n');

    const analyse = analyserCsv(contenu);

    expect(analyse.lignes.length).toBe(6);
    expect(analyse.lignes[0][0]).toBe('prenom');
    expect(analyse.nombreLignes).toBe(8);
  });

  it('ignore le BOM, les fins de ligne Windows et les lignes vides', () => {
    const contenu = `\uFEFF${ENTETE}\r\n\r\n${LIGNE}\r\n\r\n${LIGNE}\r\n`;

    const analyse = analyserCsv(contenu);

    expect(analyse.lignes[0][0]).toBe('prenom');
    expect(analyse.nombreLignes).toBe(2);
  });

  it('compte zéro ligne pour un en-tête seul ou un contenu vide', () => {
    expect(analyserCsv(ENTETE).nombreLignes).toBe(0);
    expect(analyserCsv('').nombreLignes).toBe(0);
  });
});

describe('verifierFichier', () => {
  it('accepte un .csv non vide jusqu’à 2 Mo', () => {
    expect(verifierFichier('eleves.csv', 1)).toBeNull();
    expect(verifierFichier('ELEVES.CSV', TAILLE_MAX_OCTETS)).toBeNull();
  });

  it('refuse une autre extension', () => {
    expect(verifierFichier('eleves.txt', 100)).toContain('fichier CSV');
    expect(verifierFichier('eleves.xlsx', 100)).toContain('fichier CSV');
    expect(verifierFichier('eleves', 100)).toContain('fichier CSV');
  });

  it('refuse un fichier vide', () => {
    expect(verifierFichier('eleves.csv', 0)).toBe('Le fichier sélectionné est vide.');
  });

  it('refuse un fichier de plus de 2 Mo', () => {
    expect(verifierFichier('eleves.csv', TAILLE_MAX_OCTETS + 1)).toContain('2 Mo');
  });
});

describe('verifierContenu', () => {
  it('accepte un fichier correct', () => {
    expect(verifierContenu(`${ENTETE}\n${LIGNE}\n`)).toBeNull();
  });

  it('accepte un export Excel : BOM, fins de ligne Windows, lignes vides', () => {
    expect(verifierContenu(`\uFEFF${ENTETE}\r\n${LIGNE}\r\n\r\n`)).toBeNull();
  });

  it('accepte les colonnes dans un autre ordre et sans les colonnes facultatives', () => {
    const entete = [...COLONNES_OBLIGATOIRES].reverse().join(';');
    expect(verifierContenu(`${entete}\nx;x;x;x;x;x;x;x\n`)).toBeNull();
  });

  it('ne tient pas compte de la casse des noms de colonnes, comme le serveur', () => {
    expect(verifierContenu(`${ENTETE.toUpperCase()}\n${LIGNE}\n`)).toBeNull();
  });

  it('nomme chaque colonne obligatoire absente', () => {
    const sansMere = ENTETE.replace(';nom_mere', '');

    expect(verifierContenu(`${sansMere}\n${LIGNE}\n`)).toBe(
      'Colonnes obligatoires absentes de l’en-tête : nom_mere.',
    );
    expect(verifierContenu('prenom;nom\nA;B\n')).toContain(
      'sexe, date_naissance, commune_naissance, code_ecole, classe, nom_mere',
    );
  });

  it('suggère le point-virgule quand le séparateur est une virgule', () => {
    const message = verifierContenu(
      `${ENTETE.replaceAll(';', ',')}\n${LIGNE.replaceAll(';', ',')}\n`,
    );

    expect(message).toContain('Colonnes obligatoires absentes');
    expect(message).toContain('point-virgule');
  });

  it('refuse un contenu qui n’est pas de l’UTF-8 (caractère de remplacement)', () => {
    const message = verifierContenu(
      `${ENTETE}\nAwa;Diouf;F;14/03/2014;non;Bamb\uFFFDy;E;CM2;M;;;;\n`,
    );

    expect(message).toContain('UTF-8');
    expect(message).toContain('CSV UTF-8 (délimité par des points-virgules)');
  });

  it('refuse un fichier sans ligne ou avec le seul en-tête', () => {
    expect(verifierContenu('\n\n')).toBe('Le fichier ne contient aucune ligne.');
    expect(verifierContenu(`${ENTETE}\n`)).toContain('aucune ligne à importer');
  });

  it('accepte 1 000 lignes de données et refuse 1 001', () => {
    const lignes = (n: number) => [ENTETE, ...Array.from({ length: n }, () => LIGNE)].join('\n');

    expect(verifierContenu(lignes(LIGNES_MAX))).toBeNull();
    expect(verifierContenu(lignes(LIGNES_MAX + 1))).toBe(
      'Le fichier contient 1001 lignes de données : 1 000 au maximum.',
    );
  });

  it('ne compte pas les lignes vides dans la limite', () => {
    const contenu = [ENTETE, ...Array.from({ length: LIGNES_MAX }, () => `${LIGNE}\n`)].join('\n');

    expect(verifierContenu(contenu)).toBeNull();
  });

  it('refuse la ligne d’exemple du modèle, avec son numéro de ligne physique', () => {
    const exemple = modeleCsv().split('\r\n')[1];
    const contenu = `${ENTETE}\n${LIGNE}\n\n${exemple}\n`;

    expect(verifierContenu(contenu)).toBe(
      'La ligne d’exemple du modèle est encore présente (ligne 4) : supprimez-la avant d’importer.',
    );
  });
});

describe('resumeRapport', () => {
  const rapport = (importes: number, rejetes: number) => ({
    total: importes + rejetes,
    importes,
    rejetes,
    erreurs: [],
  });

  it.each([
    [1, 1, '1 importé, 1 rejeté sur 2 lignes'],
    [0, 2, '0 importé, 2 rejetés sur 2 lignes'],
    [8, 2, '8 importés, 2 rejetés sur 10 lignes'],
    [1, 0, '1 importé, 0 rejeté sur 1 ligne'],
    [0, 0, '0 importé, 0 rejeté sur 0 ligne'],
  ])('%i importé(s), %i rejeté(s) → « %s »', (importes, rejetes, attendu) => {
    expect(resumeRapport(rapport(importes, rejetes))).toBe(attendu);
  });
});

describe('modeleCsv', () => {
  const lignes = () =>
    modeleCsv()
      .replace(/^\uFEFF/, '')
      .split('\r\n')
      .filter(Boolean);

  it('commence par un BOM UTF-8 pour qu’Excel affiche les accents', () => {
    expect(modeleCsv().charCodeAt(0)).toBe(0xfeff);
  });

  it('a pour en-tête les treize colonnes, obligatoires comprises, séparées par des points-virgules', () => {
    expect(lignes()[0].split(';')).toEqual([...COLONNES_MODELE]);
    for (const colonne of COLONNES_OBLIGATOIRES) {
      expect(lignes()[0].split(';')).toContain(colonne);
    }
  });

  it('contient une ligne d’exemple à treize valeurs, dans le même format que l’en-tête', () => {
    expect(lignes().length).toBe(2);
    expect(parserLigneCsv(lignes()[1]).length).toBe(COLONNES_MODELE.length);
  });

  it('passe les contrôles d’en-tête mais est refusé tant que la ligne d’exemple reste', () => {
    expect(verifierContenu(modeleCsv())).toContain('ligne d’exemple');
    expect(verifierContenu(modeleCsv())).not.toContain('Colonnes obligatoires');
  });

  it('devient valable une fois la ligne d’exemple retirée et une vraie ligne ajoutée', () => {
    expect(verifierContenu(`${lignes()[0]}\r\n${LIGNE}\r\n`)).toBeNull();
  });
});
