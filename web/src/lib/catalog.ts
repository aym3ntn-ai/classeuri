// Build-time access to catalog.json (generated into public/ by `npm run content`).

import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Catalog, CatalogCourse, CatalogSemester, CatalogYear, FileRef, SectionKind } from '@classeuri/shared';

let cached: Catalog | undefined;

export function loadCatalog(): Catalog {
  if (cached) return cached;
  const file = path.resolve(process.cwd(), 'public/catalog.json');
  try {
    cached = JSON.parse(readFileSync(file, 'utf8')) as Catalog;
  } catch {
    throw new Error(`Missing ${file}. Run "npm run content --workspace web" first.`);
  }
  return cached;
}

export interface CourseEntry {
  year: CatalogYear;
  semester: CatalogSemester;
  course: CatalogCourse;
}

export function allCourseEntries(): CourseEntry[] {
  return loadCatalog().years.flatMap((year) =>
    year.semesters.flatMap((semester) => semester.courses.map((course) => ({ year, semester, course }))),
  );
}

/** URL segment of each section. */
export const SECTION_ROUTES: Record<SectionKind, string> = {
  lesson: 'lecon',
  exercices: 'exercices',
  resume: 'resume',
  autres: 'autres',
};

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Site-relative link, under the /classeuri/ base path. */
export const href = (route = '') => base + route;

export const courseHref = (course: CatalogCourse) => href(`cours/${course.id}/`);

export const docHref = (course: CatalogCourse, kind: SectionKind, slug: string, solution = false) =>
  href(`cours/${course.id}/${SECTION_ROUTES[kind]}/${slug}/`) + (solution ? '?corrige=1' : '');

/** Same-origin URL of a PDF, so the site also works from a local preview. */
export const fileHref = (ref: FileRef) => href(`files/${ref.path.split('/').map(encodeURIComponent).join('/')}`);

/** "serie 1++.pdf" */
export const fileName = (ref: FileRef) => ref.path.split('/').at(-1)!;
