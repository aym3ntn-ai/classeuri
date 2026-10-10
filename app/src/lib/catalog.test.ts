import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Catalog, CatalogDocument } from '@classeuri/shared';
import { catalogUrl, courseFlag, diffCatalogs, indexDocs, isValidSource, mergeFlags, variantRef } from './catalog.ts';

const file = (title: string, hash: string) => ({
  title,
  path: `premiere/semestre-1/MATH/exercices/${title}.pdf`,
  url: `https://example.org/files/${title}.pdf`,
  size: 1000,
  pages: 2,
  updatedAt: '2026-10-08T10:00:00.000Z',
  hash,
});

const doc = (slug: string, hash: string, solutionHash?: string): CatalogDocument => ({
  id: `premiere/semestre-1/math/exercices/${slug}`,
  slug,
  ...file(slug, hash),
  ...(solutionHash && { solution: file(`${slug} corrigé`, solutionHash) }),
});

const catalog = (documents: CatalogDocument[]): Catalog => ({
  schemaVersion: 1,
  generatedAt: '2026-10-10T09:00:00.000Z',
  revision: null,
  baseUrl: 'https://example.org/',
  years: [
    {
      id: 'premiere',
      label: '1ʳᵉ année',
      semesters: [
        {
          id: 'semestre-1',
          label: 'Semestre 1',
          courses: [
            {
              id: 'premiere/semestre-1/math',
              slug: 'math',
              name: 'Math.',
              code: 'MAT',
              folder: 'MATH',
              accent: '#0F766E',
              onAccent: '#FFFFFF',
              icon: 'function',
              sections: [{ kind: 'exercices', documents }],
              documentCount: documents.length,
              totalSize: 0,
              updatedAt: '2026-10-08T10:00:00.000Z',
            },
          ],
        },
      ],
    },
  ],
});

const id = (slug: string) => `premiere/semestre-1/math/exercices/${slug}`;

test('the first catalog flags nothing', () => {
  assert.deepEqual(diffCatalogs(null, catalog([doc('serie-1', 'a')])), {});
});

test('new documents and changed hashes are flagged', () => {
  const before = catalog([doc('serie-1', 'a'), doc('serie-2', 'b', 's1')]);
  const after = catalog([doc('serie-1', 'a2'), doc('serie-2', 'b', 's2'), doc('serie-3', 'c')]);
  assert.deepEqual(diffCatalogs(before, after), {
    [id('serie-1')]: 'updated',
    [id('serie-2')]: 'updated',
    [id('serie-3')]: 'new',
  });
  assert.deepEqual(diffCatalogs(after, after), {});
});

test('flags survive a later sync until the document disappears', () => {
  const next = catalog([doc('serie-1', 'a'), doc('serie-3', 'c2')]);
  const merged = mergeFlags({ [id('serie-3')]: 'new', [id('gone')]: 'updated' }, { [id('serie-3')]: 'updated' }, next);
  assert.deepEqual(merged, { [id('serie-3')]: 'new' });
  assert.equal(courseFlag(next.years[0]!.semesters[0]!.courses[0]!, merged), 'new');
});

test('lookups', () => {
  const c = catalog([doc('serie-1', 'a', 's')]);
  const entry = indexDocs(c).get(id('serie-1'))!;
  assert.equal(entry.course.name, 'Math.');
  assert.equal(variantRef(entry.doc, 'solution').hash, 's');
  assert.equal(variantRef(entry.doc, 'sheet').hash, 'a');
});

test('source URLs', () => {
  assert.equal(catalogUrl('https://aym3ntn-ai.github.io/classeuri/'), 'https://aym3ntn-ai.github.io/classeuri/catalog.json');
  assert.equal(catalogUrl('https://aym3ntn-ai.github.io/classeuri'), 'https://aym3ntn-ai.github.io/classeuri/catalog.json');
  assert.ok(isValidSource('https://aym3ntn-ai.github.io/classeuri/'));
  assert.ok(!isValidSource('http://example.org'));
  assert.ok(!isValidSource('classeuri'));
});
