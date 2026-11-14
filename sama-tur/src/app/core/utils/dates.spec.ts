import { formaterDate, formaterDateHeure } from './dates';

describe('formaterDate', () => {
  it('écrit une date simple en jj/MM/aaaa', () => {
    expect(formaterDate('2026-11-05')).toBe('05/11/2026');
  });

  it('garde le jour tel quel pour une dateHeure, sans conversion de fuseau', () => {
    expect(formaterDate('2026-11-05T23:30:00')).toBe('05/11/2026');
    expect(formaterDate('2026-01-01T00:00:00.123456')).toBe('01/01/2026');
  });

  it('rend un tiret pour une valeur absente ou illisible', () => {
    expect(formaterDate(null)).toBe('—');
    expect(formaterDate(undefined)).toBe('—');
    expect(formaterDate('')).toBe('—');
    expect(formaterDate('5 novembre')).toBe('—');
  });
});

describe('formaterDateHeure', () => {
  it('écrit une dateHeure en jj/MM/aaaa HH:mm, telle quelle', () => {
    expect(formaterDateHeure('2026-11-05T09:05:42')).toBe('05/11/2026 09:05');
  });

  it('ne convertit pas le fuseau : minuit reste minuit', () => {
    expect(formaterDateHeure('2026-11-05T00:00:00')).toBe('05/11/2026 00:00');
    expect(formaterDateHeure('2026-11-05T23:59:59.999999')).toBe('05/11/2026 23:59');
  });

  it('ne garde que la date quand il n’y a pas d’heure', () => {
    expect(formaterDateHeure('2026-11-05')).toBe('05/11/2026');
  });

  it('rend un tiret pour une valeur absente ou illisible', () => {
    expect(formaterDateHeure(null)).toBe('—');
    expect(formaterDateHeure('hier')).toBe('—');
  });
});
