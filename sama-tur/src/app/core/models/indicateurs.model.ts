import { StatutDossier } from './dossier.model';

/** GET /api/indicateurs : les trois indicateurs de la fiche projet, plus les décomptes de dossiers. */
export interface Indicateurs {
  /** Commune de naissance filtrée, ou null pour l'ensemble. */
  communeId: number | null;
  /** AAAA-MM-JJ. */
  dateReference: string;
  /** Délai cible, en jours, au-delà duquel un jugement non transcrit est en retard. */
  delaiCibleJours: number;
  /** I1 : part des jugements transcrits dans le délai cible, entre 0 et 1 ; null sans donnée. */
  i1PartTranscritsDansDelaiCible: number | null;
  /** I2 : délai médian, en jours, entre la détection et l'acte remis ; null sans donnée. */
  i2DelaiMedianJours: number | null;
  /** I3 : élèves de CM2 sans acte remis à la date de référence ; 0 sans donnée. */
  i3ElevesClasseExamenSansActe: number;
  /** Les six étapes sont toujours présentes. */
  dossiersParEtape: Record<StatutDossier, number>;
  dossiersEnRetard: number;
  totalDossiers: number;
}
