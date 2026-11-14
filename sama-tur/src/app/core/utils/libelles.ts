import { PreuveNaissance, TypeAudience } from '../models/dossier.model';

const PREUVES: Record<PreuveNaissance, string> = {
  CERTIFICAT_ACCOUCHEMENT: 'Certificat d’accouchement',
  TEMOINS: 'Deux témoins',
};

const AUDIENCES: Record<TypeAudience, string> = {
  ORDINAIRE: 'Ordinaire',
  SPECIALE: 'Spéciale',
  FORAINE: 'Foraine',
};

export function libellePreuve(preuve: PreuveNaissance): string {
  return PREUVES[preuve] ?? preuve;
}

export function libelleAudience(audience: TypeAudience): string {
  return AUDIENCES[audience] ?? audience;
}

export function libelleSexe(sexe: 'F' | 'M'): string {
  return sexe === 'F' ? 'Féminin' : 'Masculin';
}
