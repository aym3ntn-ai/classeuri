// Pure naming rules: folder and file names in, labels, slugs and ordering out.

import type { CourseIcon, SectionKind } from '../../shared/src/catalog.ts';

const stripAccents = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '');

/** Lowercase, unaccented, words separated by single spaces. */
export function normalize(s: string): string {
  return stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** URL-safe slug. "+" is spelled out so "serie 1" and "serie 1++" stay distinct. */
export function slugify(s: string): string {
  const slug = normalize(s.replace(/\+/g, ' plus ')).replace(/ /g, '-');
  return slug || 'document';
}

/** Returns `slug`, or `slug-2`, `slug-3`… if it is already in `taken`; records the result. */
export function uniqueSlug(slug: string, taken: Set<string>): string {
  let candidate = slug;
  for (let n = 2; taken.has(candidate); n++) candidate = `${slug}-${n}`;
  taken.add(candidate);
  return candidate;
}

const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });

/** Natural order: serie 1, serie 1++, serie 2, serie 10. */
export function naturalCompare(a: string, b: string): number {
  return collator.compare(a, b) || a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
}

/** Percent-encode each segment of a repo path ("serie 1++.pdf" → "serie%201%2B%2B.pdf"). */
export function encodePath(repoPath: string): string {
  return repoPath.split('/').map(encodeURIComponent).join('/');
}

export function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Years and semesters ----------------------------------------------------

const YEAR_ORDER = ['premiere', 'deuxieme', 'troisieme', 'quatrieme', 'cinquieme'];
const YEAR_LABELS = ['1ʳᵉ année', '2ᵉ année', '3ᵉ année', '4ᵉ année', '5ᵉ année'];

export function yearRank(folder: string): number {
  const i = YEAR_ORDER.indexOf(normalize(folder));
  return i === -1 ? YEAR_ORDER.length : i;
}

export function yearLabel(folder: string): string {
  return YEAR_LABELS[YEAR_ORDER.indexOf(normalize(folder))] ?? niceCase(folder);
}

export function semesterLabel(folder: string): string {
  const m = /^semestre (\d+)$/.exec(normalize(folder));
  return m ? `Semestre ${m[1]}` : niceCase(folder);
}

// --- Course names -----------------------------------------------------------

const SMALL_WORDS = new Set(['et', 'de', 'du', 'des', 'la', 'le', 'les', 'en', 'a', 'au', 'aux', 'pour', 'sur', 'ou']);

const ACRONYMS = new Set(['eea', 'td', 'tp', 'ds', 'sql', 'uml', 'cao', 'issat', 'l1', 'l2', 'l3', 'm1', 'm2']);

// Folder names are typed without accents; these put them back.
const WORDS: Record<string, string> = {
  // Abbreviations
  elect: 'élect.',
  electr: 'électr.',
  math: 'math.',
  maths: 'maths',
  info: 'info.',
  algo: 'algo.',
  prog: 'prog.',
  // Accented words
  a: 'à',
  algebre: 'algèbre',
  electricite: 'électricité',
  electrique: 'électrique',
  electriques: 'électriques',
  electronique: 'électronique',
  electromagnetisme: 'électromagnétisme',
  energie: 'énergie',
  etude: 'étude',
  francais: 'français',
  general: 'général',
  generale: 'générale',
  ingenieur: 'ingénieur',
  lecon: 'leçon',
  magnetique: 'magnétique',
  magnetiques: 'magnétiques',
  mathematiques: 'mathématiques',
  mecanique: 'mécanique',
  methodes: 'méthodes',
  numerique: 'numérique',
  numeriques: 'numériques',
  numeration: 'numération',
  donnees: 'données',
  probabilites: 'probabilités',
  regime: 'régime',
  reseaux: 'réseaux',
  resume: 'résumé',
  systeme: 'système',
  systemes: 'systèmes',
  theorie: 'théorie',
  securite: 'sécurité',
  developpement: 'développement',
};

const capitalize = (w: string) => w.charAt(0).toLocaleUpperCase('fr') + w.slice(1);

/** "CIRCUIT ELECT ET MAGNETIQUE" → "Circuit Élect. et Magnétique". */
export function niceCase(folder: string): string {
  return folder
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((raw, i) => {
      const key = normalize(raw);
      if (ACRONYMS.has(key)) return raw.toUpperCase();
      if (i > 0 && SMALL_WORDS.has(key)) return WORDS[key] ?? key;
      // Keep the author's own casing and accents when the word is not all caps.
      const word = raw === raw.toUpperCase() ? (WORDS[key] ?? raw.toLowerCase()) : raw;
      return capitalize(word);
    })
    .join(' ');
}

/** Initials of the significant words: "CIRCUIT ELECT ET MAGNETIQUE" → "CEM". */
export function courseCode(folder: string): string {
  const words = normalize(folder).split(' ').filter((w) => w && !SMALL_WORDS.has(w));
  const first = words[0] ?? '';
  return (words.length === 1 ? first.slice(0, 3) : words.map((w) => w.charAt(0)).join('')).toUpperCase();
}

const ICON_KEYWORDS: [RegExp, CourseIcon][] = [
  [/numerique|logique|microprocesseur|architecture/, 'chip'],
  [/elect|circuit|energie/, 'bolt'],
  [/signal|onde|optique|telecom/, 'wave'],
  [/math|analyse|algebre|probabilite|statistique/, 'function'],
  [/physique|atom|thermo|mecanique/, 'atom'],
  [/chimie/, 'flask'],
  [/info|prog|algo|langage|donnees/, 'code'],
  [/anglais|francais|english|communication|langue/, 'globe'],
  [/automatique|asservissement|regulation/, 'gear'],
];

export function guessIcon(folder: string): CourseIcon {
  const key = normalize(folder);
  return ICON_KEYWORDS.find(([re]) => re.test(key))?.[1] ?? 'book';
}

// --- Sections ---------------------------------------------------------------

const SECTION_FOLDERS: Record<string, SectionKind> = {
  lesson: 'lesson',
  lessons: 'lesson',
  lecon: 'lesson',
  lecons: 'lesson',
  cours: 'lesson',
  exercices: 'exercices',
  excercices: 'exercices',
  exercice: 'exercices',
  exercises: 'exercices',
  td: 'exercices',
  tds: 'exercices',
  resume: 'resume',
  resumes: 'resume',
};

/** Section for a sub-folder of a course; unknown folders land in `autres`. */
export function sectionFromFolder(folder: string): SectionKind {
  return SECTION_FOLDERS[normalize(folder)] ?? 'autres';
}

/** Section for a PDF sitting directly in the course folder, guessed from its name. */
export function sectionFromFileName(fileName: string): SectionKind {
  const key = ` ${normalize(titleFromFileName(fileName))} `;
  if (/ (resume|resumes|synthese|fiche|recap) /.test(key)) return 'resume';
  if (/ (serie|series|td|tds|tp|tps|exercice|exercices|examen|examens|ds|devoir|corrige|correction) /.test(key)) {
    return 'exercices';
  }
  if (/ (cours|lecon|lecons|chapitre|chap|lesson) /.test(key)) return 'lesson';
  return 'autres';
}

// --- Corrections ------------------------------------------------------------

const CORRECTION = /(corrig[ée]s?|corrections?|solutions?)/giu;
const FILLER = / (de|du|des|la|le|les|avec|sans) /g;

export function isCorrection(title: string): boolean {
  return /(^|[^a-z])(corriges?|corrections?|solutions?)([^a-z]|$)/.test(stripAccents(title).toLowerCase());
}

/**
 * Key shared by a sheet and its correction: "serie 1++" and
 * "Correction de la série 1++" both give "serie 1++". Keeps "+", unlike `normalize`.
 */
export function pairingKey(title: string): string {
  let key = ` ${stripAccents(title.replace(CORRECTION, ' '))
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim()} `;
  // Twice, because adjacent fillers share their separating space.
  key = key.replace(FILLER, ' ').replace(FILLER, ' ');
  return key.trim();
}
