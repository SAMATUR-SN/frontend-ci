import { ROLES } from './core/models/utilisateur.model';
import { routes } from './app.routes';

describe('routes', () => {
  const rolesDe = (chemin: string): unknown =>
    routes.find((route) => route.path === chemin)?.data?.['roles'];

  it('n’emploie que les quatre rôles du contrat', () => {
    const reservees = routes.filter((route) => route.data?.['roles']);

    expect(reservees.length).toBeGreaterThan(0);
    for (const route of reservees) {
      for (const role of route.data?.['roles'] as string[]) {
        expect(ROLES as readonly string[]).toContain(role);
      }
    }
  });

  it.each(['eleves/nouveau', 'eleves/import', 'dossiers/nouveau'])(
    'réserve %s au rôle ECOLE',
    (chemin) => {
      expect(rolesDe(chemin)).toEqual(['ECOLE']);
    },
  );

  it('réserve les alertes à ETAT_CIVIL, TRIBUNAL et SUPERVISEUR', () => {
    expect(rolesDe('alertes')).toEqual(['ETAT_CIVIL', 'TRIBUNAL', 'SUPERVISEUR']);
  });
});
