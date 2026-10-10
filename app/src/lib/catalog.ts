// Pure helpers over catalog.json: lookups and the diff behind "Nouveau" / "Mis à jour".

import type { Catalog, CatalogCourse, CatalogDocument, FileRef, SectionKind } from '@classeuri/shared';

export type Variant = 'sheet' | 'solution';
export type Flag = 'new' | 'updated';

export interface DocEntry {
  doc: CatalogDocument;
  course: CatalogCourse;
  section: SectionKind;
}

export function allCourses(catalog: Catalog | null): CatalogCourse[] {
  return catalog?.years.flatMap((y) => y.semesters.flatMap((s) => s.courses)) ?? [];
}

export function courseDocs(course: CatalogCourse): CatalogDocument[] {
  return course.sections.flatMap((s) => s.documents);
}

/** The PDFs behind a document: the sheet, then its correction when there is one. */
export function docFiles(doc: CatalogDocument): FileRef[] {
  return doc.solution ? [doc, doc.solution] : [doc];
}

export function courseFiles(course: CatalogCourse): FileRef[] {
  return courseDocs(course).flatMap(docFiles);
}

export function indexDocs(catalog: Catalog | null): Map<string, DocEntry> {
  const index = new Map<string, DocEntry>();
  for (const course of allCourses(catalog)) {
    for (const section of course.sections) {
      for (const doc of section.documents) index.set(doc.id, { doc, course, section: section.kind });
    }
  }
  return index;
}

export function variantRef(doc: CatalogDocument, variant: Variant): FileRef {
  return variant === 'solution' && doc.solution ? doc.solution : doc;
}

const signature = (doc: CatalogDocument) => `${doc.hash}:${doc.solution?.hash ?? ''}`;

/**
 * Flags for documents that appeared or changed between two catalogs.
 * The first catalog ever loaded flags nothing: everything would be "new".
 */
export function diffCatalogs(previous: Catalog | null, next: Catalog): Record<string, Flag> {
  if (!previous) return {};
  const before = indexDocs(previous);
  const flags: Record<string, Flag> = {};
  for (const [id, { doc }] of indexDocs(next)) {
    const old = before.get(id);
    if (!old) flags[id] = 'new';
    else if (signature(old.doc) !== signature(doc)) flags[id] = 'updated';
  }
  return flags;
}

/** Earlier flags that still point at a document, with the latest diff on top. */
export function mergeFlags(current: Record<string, Flag>, fresh: Record<string, Flag>, next: Catalog): Record<string, Flag> {
  const ids = indexDocs(next);
  const kept = Object.fromEntries(Object.entries(current).filter(([id]) => ids.has(id)));
  // A document still unseen as "new" stays "new" even if it changes again.
  for (const [id, flag] of Object.entries(fresh)) kept[id] = kept[id] === 'new' ? 'new' : flag;
  return kept;
}

/** Strongest flag among a course's documents, for the tile badge. */
export function courseFlag(course: CatalogCourse, flags: Record<string, Flag>): Flag | null {
  const found = courseDocs(course).map((d) => flags[d.id]);
  return found.includes('new') ? 'new' : found.includes('updated') ? 'updated' : null;
}

/** Catalog URL for a source such as "https://user.github.io/repo" (trailing slash optional). */
export function catalogUrl(sourceUrl: string): string {
  return `${sourceUrl.replace(/\/+$/, '')}/catalog.json`;
}

export function isValidSource(url: string): boolean {
  return /^https:\/\/[^\s/]+\.[^\s/]+(\/\S*)?$/.test(url.trim());
}
