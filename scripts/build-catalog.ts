// Scans the content folders (<year>/<semester>/<COURSE>/<section>/<file>.pdf)
// and writes catalog.json. Runs on Node 24+ without a build step:
//
//   node scripts/build-catalog.ts [--root .] [--out dist/catalog.json]
//                                 [--files-out dist/files] [--base-url https://…/]
//
// --files-out also copies every catalogued PDF there, keeping its repo path.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { getDocument, VerbosityLevel } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parse as parseYaml } from 'yaml';
import {
  ACCENTS,
  CATALOG_SCHEMA_VERSION,
  COURSE_ICONS,
  SECTION_KINDS,
  type AccentName,
  type Catalog,
  type CatalogCourse,
  type CatalogDocument,
  type CatalogSection,
  type CatalogSemester,
  type CatalogYear,
  type CourseIcon,
  type FileRef,
  type SectionKind,
} from '../shared/src/catalog.ts';
import {
  courseCode,
  encodePath,
  guessIcon,
  isCorrection,
  naturalCompare,
  niceCase,
  pairingKey,
  sectionFromFileName,
  sectionFromFolder,
  semesterLabel,
  slugify,
  titleFromFileName,
  uniqueSlug,
  yearLabel,
  yearRank,
} from './lib/naming.ts';

const DEFAULT_BASE_URL = 'https://aym3ntn-ai.github.io/classeuri/';
/** Sub-path of the site where the PDFs are published. */
const FILES_PREFIX = 'files/';
/** Top-level folders that are code, not content. */
const NOT_CONTENT = new Set(['app', 'web', 'scripts', 'shared', 'docs', 'dist', 'node_modules']);
const INK = '#11151C';

const { values: args } = parseArgs({
  options: {
    root: { type: 'string', default: '.' },
    out: { type: 'string', default: 'dist/catalog.json' },
    'files-out': { type: 'string' },
    'base-url': { type: 'string', default: process.env.CLASSEURI_BASE_URL ?? DEFAULT_BASE_URL },
  },
});

const root = path.resolve(args.root);
const baseUrl = args['base-url'].endsWith('/') ? args['base-url'] : `${args['base-url']}/`;
const inCI = process.env.GITHUB_ACTIONS === 'true';

const errors: string[] = [];
const skipped: string[] = [];

function reportError(repoPath: string, message: string) {
  errors.push(`${repoPath}: ${message}`);
  if (inCI) console.log(`::error file=${repoPath}::${message}`);
}

async function listDir(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  const visible = entries.filter((e) => !e.name.startsWith('.'));
  return {
    dirs: visible.filter((e) => e.isDirectory()).map((e) => e.name).sort(naturalCompare),
    files: visible.filter((e) => e.isFile()).map((e) => e.name).sort(naturalCompare),
  };
}

function git(...gitArgs: string[]): string | null {
  try {
    return execFileSync('git', ['-C', root, ...gitArgs], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}

/** Date of the last commit touching the file; mtime for files not committed yet. */
async function lastModified(repoPath: string, absPath: string): Promise<string> {
  const committed = git('log', '-1', '--format=%cI', '--', repoPath);
  return new Date(committed ?? (await stat(absPath)).mtime).toISOString();
}

async function readPdf(repoPath: string): Promise<FileRef | null> {
  const absPath = path.join(root, repoPath);
  const data = await readFile(absPath);
  let pages: number;
  try {
    // pdf.js takes ownership of the buffer it is given, hence the copy.
    const task = getDocument({ data: new Uint8Array(data), verbosity: VerbosityLevel.ERRORS });
    const pdf = await task.promise;
    pages = pdf.numPages;
    await task.destroy();
    if (pages < 1) throw new Error('the document has no pages');
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    reportError(repoPath, `unreadable PDF (${reason}). Re-export the file or remove it from the repo.`);
    return null;
  }
  return {
    title: titleFromFileName(path.basename(repoPath)),
    path: repoPath,
    url: baseUrl + FILES_PREFIX + encodePath(repoPath),
    size: data.byteLength,
    pages,
    updatedAt: await lastModified(repoPath, absPath),
    hash: createHash('sha256').update(data).digest('hex'),
  };
}

/** PDFs of a course grouped by section; non-PDF files are recorded as skipped. */
async function collectFiles(courseDir: string): Promise<Map<SectionKind, string[]>> {
  const bySection = new Map<SectionKind, string[]>();
  const add = (kind: SectionKind, repoPath: string) => {
    if (/\.pdf$/i.test(repoPath)) bySection.set(kind, [...(bySection.get(kind) ?? []), repoPath]);
    else if (path.basename(repoPath) !== 'course.yml') skipped.push(repoPath);
  };
  const walk = async (dir: string, kind: SectionKind) => {
    const { dirs, files } = await listDir(path.join(root, dir));
    for (const f of files) add(kind, `${dir}/${f}`);
    for (const d of dirs) await walk(`${dir}/${d}`, kind);
  };

  const { dirs, files } = await listDir(path.join(root, courseDir));
  // PDFs directly in the course folder have no section folder: guess from the name.
  for (const f of files) add(sectionFromFileName(f), `${courseDir}/${f}`);
  for (const d of dirs) await walk(`${courseDir}/${d}`, sectionFromFolder(d));
  return bySection;
}

async function buildSection(kind: SectionKind, paths: string[], courseId: string): Promise<CatalogSection | null> {
  const refs = (await Promise.all(paths.map(readPdf))).filter((r) => r !== null);
  refs.sort((a, b) => naturalCompare(a.title, b.title));

  const sheets = refs.filter((r) => !isCorrection(r.title));
  const solutions = new Map<FileRef, FileRef>();
  const unpaired: FileRef[] = [];
  for (const correction of refs.filter((r) => isCorrection(r.title))) {
    const key = pairingKey(correction.title);
    const sheet = sheets.find((s) => !solutions.has(s) && pairingKey(s.title) === key);
    if (sheet) solutions.set(sheet, correction);
    else unpaired.push(correction);
  }

  const slugs = new Set<string>();
  const documents = [...sheets, ...unpaired]
    .sort((a, b) => naturalCompare(a.title, b.title))
    .map((ref): CatalogDocument => {
      const slug = uniqueSlug(slugify(ref.title), slugs);
      const solution = solutions.get(ref);
      return { id: `${courseId}/${kind}/${slug}`, slug, ...ref, ...(solution && { solution }) };
    });
  return documents.length > 0 ? { kind, documents } : null;
}

interface CourseOverrides {
  name?: string;
  code?: string;
  accent?: string;
  icon?: string;
}

async function readOverrides(courseDir: string): Promise<CourseOverrides> {
  const repoPath = `${courseDir}/course.yml`;
  let text: string;
  try {
    text = await readFile(path.join(root, repoPath), 'utf8');
  } catch {
    return {};
  }
  try {
    const data: unknown = parseYaml(text);
    if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new Error('expected key: value pairs');
    const o = data as Record<string, unknown>;
    const str = (k: string) => (o[k] == null ? undefined : String(o[k]).trim() || undefined);
    const overrides = { name: str('name'), code: str('code'), accent: str('accent'), icon: str('icon') };
    if (overrides.accent && !(overrides.accent in ACCENTS) && !/^#[0-9a-f]{6}$/i.test(overrides.accent)) {
      throw new Error(`accent must be one of ${Object.keys(ACCENTS).join(', ')} or a #RRGGBB color`);
    }
    if (overrides.icon && !COURSE_ICONS.includes(overrides.icon as CourseIcon)) {
      throw new Error(`icon must be one of ${COURSE_ICONS.join(', ')}`);
    }
    return overrides;
  } catch (e) {
    reportError(repoPath, `invalid course.yml (${e instanceof Error ? e.message : e})`);
    return {};
  }
}

/** Ink on light accents (saffron), white on the others. */
function onAccent(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? INK : '#FFFFFF';
}

/** Default accent: picked from the slug so it stays put, then moved off colors already used nearby. */
function defaultAccent(slug: string, used: Set<string>): string {
  const palette = Object.values(ACCENTS);
  const start = createHash('sha256').update(slug).digest()[0]! % palette.length;
  for (let i = 0; i < palette.length; i++) {
    const color = palette[(start + i) % palette.length]!;
    if (!used.has(color)) return color;
  }
  return palette[start]!;
}

async function buildSemester(yearId: string, semesterId: string): Promise<CatalogSemester | null> {
  const semesterDir = `${yearId}/${semesterId}`;
  const slugs = new Set<string>();
  const usedAccents = new Set<string>();
  const courses: CatalogCourse[] = [];

  for (const folder of (await listDir(path.join(root, semesterDir))).dirs) {
    const courseDir = `${semesterDir}/${folder}`;
    const overrides = await readOverrides(courseDir);
    const slug = uniqueSlug(slugify(folder), slugs);
    const id = `${semesterDir}/${slug}`;

    const files = await collectFiles(courseDir);
    const sections: CatalogSection[] = [];
    for (const kind of SECTION_KINDS) {
      const section = await buildSection(kind, files.get(kind) ?? [], id);
      if (section) sections.push(section);
    }
    if (sections.length === 0) continue;

    const accent = overrides.accent
      ? (ACCENTS[overrides.accent as AccentName] ?? overrides.accent.toUpperCase())
      : defaultAccent(slug, usedAccents);
    usedAccents.add(accent);

    const documents = sections.flatMap((s) => s.documents);
    const refs = documents.flatMap((d) => (d.solution ? [d, d.solution] : [d]));
    courses.push({
      id,
      slug,
      name: overrides.name ?? niceCase(folder),
      code: overrides.code ?? courseCode(folder),
      folder,
      accent,
      onAccent: onAccent(accent),
      icon: (overrides.icon as CourseIcon | undefined) ?? guessIcon(folder),
      sections,
      documentCount: documents.length,
      totalSize: refs.reduce((sum, r) => sum + r.size, 0),
      updatedAt: refs.map((r) => r.updatedAt).sort().at(-1)!,
    });
  }
  return courses.length > 0 ? { id: semesterId, label: semesterLabel(semesterId), courses } : null;
}

async function buildCatalog(): Promise<Catalog> {
  const yearIds = (await listDir(root)).dirs
    .filter((d) => !NOT_CONTENT.has(d))
    .sort((a, b) => yearRank(a) - yearRank(b) || naturalCompare(a, b));

  const years: CatalogYear[] = [];
  for (const yearId of yearIds) {
    const semesters: CatalogSemester[] = [];
    for (const semesterId of (await listDir(path.join(root, yearId))).dirs) {
      const semester = await buildSemester(yearId, semesterId);
      if (semester) semesters.push(semester);
    }
    if (semesters.length > 0) years.push({ id: yearId, label: yearLabel(yearId), semesters });
  }

  return {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    revision: git('rev-parse', 'HEAD'),
    baseUrl,
    years,
  };
}

const catalog = await buildCatalog();

if (errors.length > 0) {
  console.error(`\nCatalog not generated: ${errors.length} problem(s) to fix.\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

const out = path.resolve(args.out);
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify(catalog, null, 2)}\n`);

const courses = catalog.years.flatMap((y) => y.semesters.flatMap((s) => s.courses));
const refs = courses.flatMap((c) => c.sections.flatMap((s) => s.documents.flatMap((d) => (d.solution ? [d, d.solution] : [d]))));

if (args['files-out']) {
  const filesOut = path.resolve(args['files-out']);
  for (const ref of refs) {
    const dest = path.join(filesOut, ref.path);
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(path.join(root, ref.path), dest);
  }
}

for (const s of skipped) console.log(`  – skipped (not a PDF): ${s}`);
console.log(`✓ ${path.relative(process.cwd(), out)}: ${courses.length} course(s), ${refs.length} PDF(s)`);
