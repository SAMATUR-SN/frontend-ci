import { ValidationErrors, ValidatorFn } from '@angular/forms';

import {
  AvancerDossierRequest,
  DossierDetail,
  PreuveNaissance,
  StatutDossier,
  Temoin,
  TypeAudience,
} from '../models/dossier.model';

/** Valeurs brutes d'un formulaire d'avancement : tout peut être vide ou d'un type de saisie. */
export interface ValeursAvancement {
  numeroCertificat?: string | null;
  dateCertificat?: string | null;
  centreEtatCivilId?: number | string | null;
  preuveNaissance?: PreuveNaissance | '' | null;
  temoins?: Partial<Temoin>[] | null;
  numeroJugement?: string | null;
  dateJugement?: string | null;
  tribunalId?: number | string | null;
  typeAudience?: TypeAudience | '' | null;
  numeroActe?: string | null;
  anneeActe?: number | string | null;
  dateTranscription?: string | null;
  dateRemise?: string | null;
  commentaire?: string | null;
}

function texte(valeur: unknown): string | undefined {
  const nettoye = typeof valeur === 'string' ? valeur.trim() : '';

  return nettoye === '' ? undefined : nettoye;
}

function nombre(valeur: unknown): number | undefined {
  if (valeur === null || valeur === undefined || valeur === '') {
    return undefined;
  }
  const converti = Number(valeur);

  return Number.isFinite(converti) ? converti : undefined;
}

/**
 * Construit le corps de POST /avancer : `etapeCible` (jamais saisie) et les seuls champs de cette
 * étape, sans chaîne vide ni valeur absente. Les deux témoins ne partent que pour la preuve
 * TEMOINS, même si le formulaire en garde des valeurs d'un choix précédent.
 */
export function construireRequete(
  etapeCible: StatutDossier,
  valeurs: ValeursAvancement,
): AvancerDossierRequest {
  const champs: Partial<AvancerDossierRequest> = {};

  switch (etapeCible) {
    case 'CERTIFICAT_OBTENU':
      champs.numeroCertificat = texte(valeurs.numeroCertificat);
      champs.dateCertificat = texte(valeurs.dateCertificat);
      champs.centreEtatCivilId = nombre(valeurs.centreEtatCivilId);
      break;
    case 'DOSSIER_COMPLET': {
      const preuve = texte(valeurs.preuveNaissance) as PreuveNaissance | undefined;
      champs.preuveNaissance = preuve;
      if (preuve === 'TEMOINS') {
        champs.temoins = (valeurs.temoins ?? []).map((t) => ({
          nomComplet: texte(t.nomComplet) ?? '',
          numeroPiece: texte(t.numeroPiece) ?? '',
        }));
      }
      break;
    }
    case 'JUGEMENT_RENDU':
      champs.numeroJugement = texte(valeurs.numeroJugement);
      champs.dateJugement = texte(valeurs.dateJugement);
      champs.tribunalId = nombre(valeurs.tribunalId);
      champs.typeAudience = texte(valeurs.typeAudience) as TypeAudience | undefined;
      break;
    case 'TRANSCRIT':
      champs.numeroActe = texte(valeurs.numeroActe);
      champs.anneeActe = nombre(valeurs.anneeActe);
      champs.dateTranscription = texte(valeurs.dateTranscription);
      break;
    case 'ACTE_REMIS':
      champs.dateRemise = texte(valeurs.dateRemise);
      break;
    default:
      break;
  }

  champs.commentaire = texte(valeurs.commentaire);

  const requete: AvancerDossierRequest = { etapeCible };
  for (const [cle, valeur] of Object.entries(champs)) {
    if (valeur !== undefined) {
      (requete as unknown as Record<string, unknown>)[cle] = valeur;
    }
  }

  return requete;
}

/**
 * La dernière date déjà présente sur le dossier : la prochaine date saisie ne peut pas lui être
 * antérieure (chronologie du contrat). Les dates AAAA-MM-JJ se comparent comme des chaînes.
 */
export function derniereDate(
  dossier: Pick<
    DossierDetail,
    'dateDetection' | 'dateCertificat' | 'dateJugement' | 'dateTranscription' | 'dateRemise'
  >,
): string | null {
  const dates = [
    dossier.dateDetection,
    dossier.dateCertificat,
    dossier.dateJugement,
    dossier.dateTranscription,
    dossier.dateRemise,
  ].filter((d): d is string => !!d);

  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
}

/** La date du jour du navigateur, au format AAAA-MM-JJ, en heure locale (pas en UTC). */
export function aujourdhui(maintenant: Date = new Date()): string {
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');

  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valide une date AAAA-MM-JJ : comprise entre `min` (si connue) et `max` (aujourd'hui).
 * Une valeur vide n'est pas jugée ici : c'est le rôle de `Validators.required`.
 */
export function validerDate(min: string | null, max: string): ValidatorFn {
  return (controle): ValidationErrors | null => {
    const valeur = controle.value as string | null;

    if (!valeur) {
      return null;
    }
    if (!FORMAT_DATE.test(valeur)) {
      return { dateInvalide: true };
    }
    if (min && valeur < min) {
      return { dateAvant: { min } };
    }
    if (valeur > max) {
      return { dateFuture: { max } };
    }

    return null;
  };
}
