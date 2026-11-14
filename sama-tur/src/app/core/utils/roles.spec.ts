import { ROLES } from '../models/utilisateur.model';
import { libelleRole } from './roles';

describe('libelleRole', () => {
  it('donne un libellé français aux quatre rôles', () => {
    expect(ROLES.map(libelleRole)).toEqual(['École', 'État civil', 'Tribunal', 'Superviseur']);
  });
});
