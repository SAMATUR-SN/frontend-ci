export const CLASSES = ['PRESCOLAIRE', 'CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'] as const;

export type Classe = (typeof CLASSES)[number];
