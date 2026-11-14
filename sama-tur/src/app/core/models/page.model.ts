/** Réponse paginée du backend ; `page` commence à 0. */
export interface Page<T> {
  contenu: T[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}
