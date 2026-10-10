// Shape of catalog.json, shared by the generator, the web app and the mobile app.
// Bump CATALOG_SCHEMA_VERSION on any breaking change so old clients can refuse
// a catalog they do not understand instead of misreading it.

export const CATALOG_SCHEMA_VERSION = 1;

/** Sections in display order. `autres` holds PDFs that fit no known section. */
export const SECTION_KINDS = ['lesson', 'exercices', 'resume', 'autres'] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export const ACCENTS = {
  teal: '#0F766E',
  cobalt: '#1D3FB8',
  vermilion: '#C2410C',
  saffron: '#F2B01E',
} as const;
export type AccentName = keyof typeof ACCENTS;

export const COURSE_ICONS = [
  'book',
  'bolt',
  'chip',
  'wave',
  'atom',
  'function',
  'code',
  'flask',
  'globe',
  'gear',
] as const;
export type CourseIcon = (typeof COURSE_ICONS)[number];

/** One PDF as stored in the repo and served from GitHub Pages. */
export interface FileRef {
  /** File name without extension, underscores shown as spaces. */
  title: string;
  /** Repo-relative path, exactly as on disk (not encoded). */
  path: string;
  /** Absolute, percent-encoded URL of the PDF. */
  url: string;
  /** Size in bytes. */
  size: number;
  /** Page count. */
  pages: number;
  /** ISO 8601 date of the last commit that touched the file. */
  updatedAt: string;
  /** SHA-256 of the file content, hex. Clients compare it to detect changes. */
  hash: string;
}

export interface CatalogDocument extends FileRef {
  /** Stable id: `<course id>/<section>/<slug>`. Key for downloads and reading position. */
  id: string;
  /** URL-safe, unique within its section. */
  slug: string;
  /** The paired correction ("Avec corrigé"), when one exists. */
  solution?: FileRef;
}

export interface CatalogSection {
  kind: SectionKind;
  documents: CatalogDocument[];
}

export interface CatalogCourse {
  /** Stable id: `<year>/<semester>/<slug>`. */
  id: string;
  /** URL-safe, unique within its semester. */
  slug: string;
  /** Display name: course.yml `name`, else the folder name nicely cased. */
  name: string;
  /** Short code shown in mono caps: course.yml `code`, else the folder initials. */
  code: string;
  /** Folder name exactly as on disk. */
  folder: string;
  /** Accent color, hex. */
  accent: string;
  /** Text color to use on the accent, hex. */
  onAccent: string;
  icon: CourseIcon;
  sections: CatalogSection[];
  /** Number of documents; a sheet and its correction count as one. */
  documentCount: number;
  /** Bytes of every PDF in the course, corrections included. */
  totalSize: number;
  /** Most recent `updatedAt` among the course files. */
  updatedAt: string;
}

export interface CatalogSemester {
  /** Folder name, e.g. `semestre-1`. */
  id: string;
  label: string;
  courses: CatalogCourse[];
}

export interface CatalogYear {
  /** Folder name, e.g. `premiere`. */
  id: string;
  label: string;
  semesters: CatalogSemester[];
}

export interface Catalog {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  generatedAt: string;
  /** Commit the catalog was built from, when known. */
  revision: string | null;
  /** Site root, with trailing slash. */
  baseUrl: string;
  years: CatalogYear[];
}
