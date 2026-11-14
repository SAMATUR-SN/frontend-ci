import { RapportImport } from '../models/rapport-import.model';

/** Colonnes que le serveur exige dans l'en-tête, reconnues par leur nom, dans n'importe quel ordre. */
export const COLONNES_OBLIGATOIRES = [
  'prenom',
  'nom',
  'sexe',
  'date_naissance',
  'commune_naissance',
  'code_ecole',
  'classe',
  'nom_mere',
] as const;

/** En-tête du modèle téléchargeable : les colonnes obligatoires, puis les facultatives. */
export const COLONNES_MODELE = [
  'prenom',
  'nom',
  'sexe',
  'date_naissance',
  'date_naissance_presumee',
  'commune_naissance',
  'code_ecole',
  'classe',
  'nom_mere',
  'nom_pere',
  'telephone_parent',
  'langue_contact',
  'numero_ine',
] as const;

export const TAILLE_MAX_OCTETS = 2 * 1024 * 1024;
export const LIGNES_MAX = 1000;
/** Nom de l'élève de la ligne d'exemple du modèle : une ligne à ne jamais importer. */
export const NOM_EXEMPLE = 'EXEMPLE';

const LIGNE_EXEMPLE = `Exemple;${NOM_EXEMPLE};F;01/01/2015;non;Bambey;ECO-BAM-01;CM2;Mère exemple;;;WOLOF;`;

/** Découpe une ligne CSV au point-virgule, en respectant les guillemets (`""` = un guillemet). */
export function parserLigneCsv(ligne: string): string[] {
  const cellules: string[] = [];
  let valeur = '';
  let entreGuillemets = false;

  for (let i = 0; i < ligne.length; i++) {
    const caractere = ligne[i];

    if (caractere === '"') {
      if (entreGuillemets && ligne[i + 1] === '"') {
        valeur += '"';
        i++;
      } else {
        entreGuillemets = !entreGuillemets;
      }
    } else if (caractere === ';' && !entreGuillemets) {
      cellules.push(valeur.trim());
      valeur = '';
    } else {
      valeur += caractere;
    }
  }

  cellules.push(valeur.trim());
  return cellules;
}

/** Les lignes du fichier avec leur numéro physique (en-tête = 1), lignes vides écartées. */
function lignesNumerotees(contenu: string): { numero: number; texte: string }[] {
  return contenu
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((texte, i) => ({ numero: i + 1, texte }))
    .filter((ligne) => ligne.texte.trim() !== '');
}

export interface ApercuCsv {
  /** L'en-tête puis les cinq premières lignes de données. */
  lignes: string[][];
  /** Nombre de lignes de données (en-tête exclu, lignes vides exclues). */
  nombreLignes: number;
}

export function analyserCsv(contenu: string): ApercuCsv {
  const lignes = lignesNumerotees(contenu);

  return {
    lignes: lignes.slice(0, 6).map((ligne) => parserLigneCsv(ligne.texte)),
    nombreLignes: Math.max(lignes.length - 1, 0),
  };
}

/** Contrôles possibles avant lecture : nom et taille. Rend le message de refus, ou null. */
export function verifierFichier(nom: string, taille: number): string | null {
  if (!nom.toLowerCase().endsWith('.csv')) {
    return 'Veuillez sélectionner un fichier CSV (extension .csv).';
  }
  if (taille === 0) {
    return 'Le fichier sélectionné est vide.';
  }
  if (taille > TAILLE_MAX_OCTETS) {
    return 'Le fichier dépasse 2 Mo : divisez-le en plusieurs fichiers.';
  }
  return null;
}

/**
 * Contrôles sur le contenu lu en UTF-8, calqués sur ce que le serveur refuse : encodage, colonnes
 * obligatoires (noms insensibles à la casse, ordre libre), 1 000 lignes de données au plus. Refuse
 * aussi la ligne d'exemple du modèle, qu'il ne faut pas importer. Rend le message de refus, ou null.
 */
export function verifierContenu(contenu: string): string | null {
  if (contenu.includes('\uFFFD')) {
    return 'Le fichier n’est pas encodé en UTF-8. Dans Excel, enregistrez-le au format « CSV UTF-8 (délimité par des points-virgules) ».';
  }

  const lignes = lignesNumerotees(contenu);
  if (lignes.length === 0) {
    return 'Le fichier ne contient aucune ligne.';
  }

  const entete = parserLigneCsv(lignes[0].texte).map((c) => c.toLowerCase());
  const manquantes = COLONNES_OBLIGATOIRES.filter((colonne) => !entete.includes(colonne));
  if (manquantes.length > 0) {
    const separateur =
      !lignes[0].texte.includes(';') && lignes[0].texte.includes(',')
        ? ' Le séparateur doit être le point-virgule (;).'
        : '';
    return `Colonnes obligatoires absentes de l’en-tête : ${manquantes.join(', ')}.${separateur}`;
  }

  const donnees = lignes.slice(1);
  if (donnees.length === 0) {
    return 'Le fichier ne contient que l’en-tête : aucune ligne à importer.';
  }
  if (donnees.length > LIGNES_MAX) {
    return `Le fichier contient ${donnees.length} lignes de données : 1 000 au maximum.`;
  }

  const colonneNom = entete.indexOf('nom');
  const exemple = donnees.find(
    (ligne) => parserLigneCsv(ligne.texte)[colonneNom]?.toUpperCase() === NOM_EXEMPLE,
  );
  if (exemple) {
    return `La ligne d’exemple du modèle est encore présente (ligne ${exemple.numero}) : supprimez-la avant d’importer.`;
  }

  return null;
}

/**
 * Le modèle téléchargeable : l'en-tête exact et une ligne d'exemple. Séparateur point-virgule, fins
 * de ligne Windows, BOM UTF-8 pour qu'Excel affiche les accents (le serveur accepte le BOM).
 */
export function modeleCsv(): string {
  return `\uFEFF${COLONNES_MODELE.join(';')}\r\n${LIGNE_EXEMPLE}\r\n`;
}

/** \u00AB 1 import\u00E9, 1 rejet\u00E9 sur 2 lignes \u00BB : chaque mot est accord\u00E9 au nombre qui le pr\u00E9c\u00E8de. */
export function resumeRapport(rapport: RapportImport): string {
  const accord = (n: number, singulier: string) => (n > 1 ? `${singulier}s` : singulier);

  return (
    `${rapport.importes} ${accord(rapport.importes, 'import\u00E9')}, ` +
    `${rapport.rejetes} ${accord(rapport.rejetes, 'rejet\u00E9')} ` +
    `sur ${rapport.total} ${accord(rapport.total, 'ligne')}`
  );
}
