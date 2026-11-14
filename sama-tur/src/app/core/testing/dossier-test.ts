import { DossierDetail, ETAPES, StatutDossier } from '../models/dossier.model';
import { rangEtape } from '../utils/etapes';

/**
 * Un dossier fictif à l'étape donnée, avec les données que le backend aurait déjà enregistrées
 * jusqu'à cette étape (dates croissantes). Aucune donnée réelle.
 */
export function unDossierDetail(
  etape: StatutDossier = 'DETECTE',
  surcharge: Partial<DossierDetail> = {},
): DossierDetail {
  const rang = rangEtape(etape);
  const apres = (etapeMin: StatutDossier) => rang >= rangEtape(etapeMin);

  return {
    id: 12,
    reference: 'ST-2026-000012',
    etape,
    enRetard: false,
    joursDepuisJugement: null,
    eleve: {
      id: 5,
      numeroIne: null,
      prenom: 'Awa',
      nom: 'Test',
      sexe: 'F',
      dateNaissance: '2015-03-02',
      dateNaissancePresumee: false,
      classe: 'CM2',
      ecoleId: 7,
      ecole: 'École de test',
      communeNaissanceId: 1,
      communeNaissance: 'Bambey',
      nomPere: null,
      nomMere: 'Mère Test',
      telephoneParent: null,
      langueContact: 'WOLOF',
    },
    dateDetection: '2026-09-01',
    numeroCertificat: apres('CERTIFICAT_OBTENU') ? 'CERT-001' : null,
    dateCertificat: apres('CERTIFICAT_OBTENU') ? '2026-09-10' : null,
    centreEtatCivilId: apres('CERTIFICAT_OBTENU') ? 3 : null,
    centreEtatCivil: apres('CERTIFICAT_OBTENU') ? 'Centre de test' : null,
    preuveNaissance: apres('DOSSIER_COMPLET') ? 'TEMOINS' : null,
    temoins: apres('DOSSIER_COMPLET')
      ? [
          { nomComplet: 'Témoin Un', numeroPiece: 'P-1' },
          { nomComplet: 'Témoin Deux', numeroPiece: 'P-2' },
        ]
      : [],
    numeroJugement: apres('JUGEMENT_RENDU') ? 'JUG-001' : null,
    dateJugement: apres('JUGEMENT_RENDU') ? '2026-09-20' : null,
    tribunalId: apres('JUGEMENT_RENDU') ? 2 : null,
    tribunal: apres('JUGEMENT_RENDU') ? 'Tribunal de test' : null,
    typeAudience: apres('JUGEMENT_RENDU') ? 'ORDINAIRE' : null,
    numeroActe: apres('TRANSCRIT') ? 'ACTE-001' : null,
    anneeActe: apres('TRANSCRIT') ? 2026 : null,
    dateTranscription: apres('TRANSCRIT') ? '2026-10-01' : null,
    dateRemise: apres('ACTE_REMIS') ? '2026-10-10' : null,
    historique: ETAPES.slice(0, rang + 1).map((arrivee, i) => ({
      etapeDepart: i === 0 ? null : ETAPES[i - 1],
      etapeArrivee: arrivee,
      dateHeure: `2026-09-${String(i + 1).padStart(2, '0')}T08:00:00`,
      auteur: 'Auteur de test',
      role: 'ECOLE',
      commentaire: null,
    })),
    ...surcharge,
  };
}
