import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fr } from '../../shared/src/fr.ts';
import { formatDate, formatSize } from '../../shared/src/format.ts';
import {
  courseCode,
  encodePath,
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
} from '../lib/naming.ts';

test('course names are nicely cased with accents restored', () => {
  assert.equal(niceCase('CIRCUIT ELECT ET MAGNETIQUE'), 'Circuit Élect. et Magnétique');
  assert.equal(niceCase('CIRCUIT NUMERIQUE'), 'Circuit Numérique');
  assert.equal(niceCase('Analyse 1'), 'Analyse 1');
  assert.equal(niceCase('TP ELECTRONIQUE'), 'TP Électronique');
});

test('course codes are the initials of the significant words', () => {
  assert.equal(courseCode('CIRCUIT ELECT ET MAGNETIQUE'), 'CEM');
  assert.equal(courseCode('CIRCUIT NUMERIQUE'), 'CN');
  assert.equal(courseCode('ANALYSE'), 'ANA');
});

test('year and semester labels', () => {
  assert.equal(yearLabel('premiere'), '1ʳᵉ année');
  assert.equal(yearLabel('deuxieme'), '2ᵉ année');
  assert.equal(semesterLabel('semestre-1'), 'Semestre 1');
});

test('slugs are URL-safe and keep "+" variants apart', () => {
  assert.equal(slugify('CIRCUIT ELECT ET MAGNETIQUE'), 'circuit-elect-et-magnetique');
  assert.equal(slugify('serie 1'), 'serie-1');
  assert.equal(slugify('serie 1++'), 'serie-1-plus-plus');
  assert.equal(slugify('Série n°3 (corrigé)'), 'serie-n-3-corrige');
  const taken = new Set<string>();
  assert.deepEqual([uniqueSlug('a', taken), uniqueSlug('a', taken), uniqueSlug('a', taken)], ['a', 'a-2', 'a-3']);
});

test('file URLs are percent-encoded segment by segment', () => {
  assert.equal(
    encodePath('premiere/semestre-1/CIRCUIT ELECT ET MAGNETIQUE/lesson/série 1++.pdf'),
    'premiere/semestre-1/CIRCUIT%20ELECT%20ET%20MAGNETIQUE/lesson/s%C3%A9rie%201%2B%2B.pdf',
  );
});

test('natural sort order', () => {
  const sorted = ['serie 10', 'serie 2', 'serie 1++', 'Serie 1', 'serie 1+'].sort(naturalCompare);
  assert.deepEqual(sorted, ['Serie 1', 'serie 1+', 'serie 1++', 'serie 2', 'serie 10']);
});

test('titles are the file name without extension', () => {
  assert.equal(titleFromFileName('serie 1++.pdf'), 'serie 1++');
  assert.equal(titleFromFileName('Resume_Systemes_de_Numeration.PDF'), 'Resume Systemes de Numeration');
});

test('section folders, including the existing misspelling', () => {
  assert.equal(sectionFromFolder('lesson'), 'lesson');
  assert.equal(sectionFromFolder('excercices'), 'exercices');
  assert.equal(sectionFromFolder('exercices'), 'exercices');
  assert.equal(sectionFromFolder('Résumé'), 'resume');
  assert.equal(sectionFromFolder('annales'), 'autres');
});

test('files without a section folder are classified by name', () => {
  assert.equal(sectionFromFileName('Cours_Circuits_Electriques_Regime_Continu_EEA.pdf'), 'lesson');
  assert.equal(sectionFromFileName('TDs-circuits-electriques.pdf'), 'exercices');
  assert.equal(sectionFromFileName('serie 1++.pdf'), 'exercices');
  assert.equal(sectionFromFileName('Resume_Systemes_de_Numeration_L1_EEA.pdf'), 'resume');
  assert.equal(sectionFromFileName('planning.pdf'), 'autres');
});

test('corrections pair with their sheet', () => {
  assert.ok(isCorrection('serie 1 corrigé'));
  assert.ok(isCorrection('Correction_serie 2'));
  assert.ok(isCorrection('TD3-solutions'));
  assert.ok(!isCorrection('serie 1'));
  assert.ok(!isCorrection('Dissolution des sels'));
  assert.equal(pairingKey('serie 1 corrigé'), pairingKey('serie 1'));
  assert.equal(pairingKey('Correction de la série 1++'), pairingKey('serie 1++'));
  assert.equal(pairingKey('serie 2 - avec solutions'), pairingKey('Serie 2'));
  assert.notEqual(pairingKey('serie 1 corrigé'), pairingKey('serie 1++'));
});

test('French sizes and dates', () => {
  assert.equal(formatSize(1_887_436, fr.format), '1,8 Mo');
  assert.equal(formatSize(26_515, fr.format), '26 Ko');
  assert.equal(formatSize(25_165_824, fr.format), '24 Mo');
  const now = new Date('2026-10-10T12:00:00');
  assert.equal(formatDate('2026-10-08T10:00:00', fr.format, now), '8 oct.');
  assert.equal(formatDate('2025-03-01T10:00:00', fr.format, now), '1ᵉʳ mars 2025');
});
