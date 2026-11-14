import { HttpErrorResponse } from '@angular/common/http';

import { extraireProbleme } from './probleme';

function erreur(status: number, corps: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: corps });
}

describe('extraireProbleme', () => {
  it('lit un problem+json complet avec ses erreurs de champ', () => {
    const resultat = extraireProbleme(
      erreur(422, {
        type: 'https://samatur.sn/erreurs/champ-obligatoire',
        title: 'Champ obligatoire manquant',
        status: 422,
        detail: 'Le passage à JUGEMENT_RENDU exige : dateJugement.',
        erreurs: [{ champ: 'dateJugement', message: 'obligatoire' }],
      }),
    );

    expect(resultat).toEqual({
      status: 422,
      titre: 'Champ obligatoire manquant',
      detail: 'Le passage à JUGEMENT_RENDU exige : dateJugement.',
      erreurs: [{ champ: 'dateJugement', message: 'obligatoire' }],
    });
  });

  it('tolère un corps vide (401 d’une route protégée)', () => {
    expect(extraireProbleme(erreur(401, null))).toEqual({
      status: 401,
      titre: '',
      detail: '',
      erreurs: [],
    });
  });

  it('tolère un corps texte vide', () => {
    expect(extraireProbleme(erreur(401, ''))).toEqual({
      status: 401,
      titre: '',
      detail: '',
      erreurs: [],
    });
  });

  it('tolère un corps qui n’est pas du JSON (page HTML d’un proxy)', () => {
    const resultat = extraireProbleme(erreur(502, '<html>Bad Gateway</html>'));

    expect(resultat.status).toBe(502);
    expect(resultat.detail).toBe('');
    expect(resultat.erreurs).toEqual([]);
  });

  it('lit un problem+json reçu sous forme de texte', () => {
    const resultat = extraireProbleme(erreur(409, '{"title":"Conflit","detail":"déjà modifié"}'));

    expect(resultat).toMatchObject({ status: 409, titre: 'Conflit', detail: 'déjà modifié' });
  });

  it('rend le statut 0 quand le serveur n’a pas répondu', () => {
    const resultat = extraireProbleme(erreur(0, new ProgressEvent('error')));

    expect(resultat).toEqual({ status: 0, titre: '', detail: '', erreurs: [] });
  });

  it('ignore les champs de type inattendu et les erreurs mal formées', () => {
    const resultat = extraireProbleme(
      erreur(422, {
        title: 42,
        detail: { a: 1 },
        erreurs: [{ champ: 'a', message: 'obligatoire' }, { message: 'sans champ' }, 'texte', null],
      }),
    );

    expect(resultat.titre).toBe('');
    expect(resultat.detail).toBe('');
    expect(resultat.erreurs).toEqual([{ champ: 'a', message: 'obligatoire' }]);
  });

  it('ignore un corps qui est un tableau', () => {
    expect(extraireProbleme(erreur(400, [1, 2])).erreurs).toEqual([]);
  });

  it('ne lève pas pour une erreur qui n’est pas HTTP', () => {
    expect(extraireProbleme(new Error('boum'))).toEqual({
      status: 0,
      titre: '',
      detail: '',
      erreurs: [],
    });
    expect(extraireProbleme(undefined).status).toBe(0);
  });
});
