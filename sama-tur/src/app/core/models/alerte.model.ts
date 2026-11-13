import { Dossier } from './dossier.model';

export interface Alerte {
  id: number;
  dossier: Dossier;
  message: string;
  dateAlerte: string;
  resolue: boolean;
}