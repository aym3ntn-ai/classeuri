// In-page PDF viewer: continuous scroll, pages drawn only when they come near
// the viewport, zoom, go to page, and reopening at the last page read.

import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface FileLink {
  url: string;
  name: string;
}

interface Config {
  docId: string;
  sheet: FileLink;
  solution: FileLink | null;
  strings: { pageOf: string; resumedAt: string; error: string };
}

type Variant = 'sheet' | 'solution';

const root = document.getElementById('viewer')!;
const config = JSON.parse(root.dataset.config!) as Config;
const pagesEl = root.querySelector<HTMLElement>('[data-pages]')!;
const statusEl = root.querySelector<HTMLElement>('[data-status]')!;
const labelEl = root.querySelector<HTMLElement>('[data-page-label]')!;
const toastEl = root.querySelector<HTMLElement>('[data-toast]')!;
const downloadEl = root.querySelector<HTMLAnchorElement>('[data-download]')!;
const gotoForm = root.querySelector<HTMLFormElement>('[data-goto]')!;
const gotoInput = root.querySelector<HTMLInputElement>('[data-goto-input]')!;

const MAX_PAGE_WIDTH = 920;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
/** Canvas pixels are capped so large pages on dense screens stay within memory. */
const MAX_CANVAS_PIXELS = 12_000_000;

let pdf: PDFDocumentProxy | null = null;
let variant: Variant = new URLSearchParams(location.search).has('corrige') && config.solution ? 'solution' : 'sheet';
let zoom = 1;
let current = 1;
/** Height / width of each page, filled in as pages are measured. */
let ratios: number[] = [];
let holders: HTMLElement[] = [];
const tasks = new Map<number, RenderTask>();
/** Bumped on every load so work started for a previous document is dropped. */
let generation = 0;

const storageKey = () => `classeuri.page.${config.docId}#${variant}`;

function readStoredPage(): number {
  try {
    return Number(localStorage.getItem(storageKey())) || 1;
  } catch {
    return 1;
  }
}

function storePage(page: number) {
  try {
    localStorage.setItem(storageKey(), String(page));
  } catch {}
}

const fill = (template: string, ...values: number[]) => values.reduce((text, v) => text.replace('%', String(v)), template);

function pageWidth(): number {
  const available = pagesEl.clientWidth - 28;
  return Math.max(120, Math.round(Math.min(available, MAX_PAGE_WIDTH) * zoom));
}

function layout() {
  const width = pageWidth();
  holders.forEach((holder, i) => {
    holder.style.width = `${width}px`;
    holder.style.height = `${Math.round(width * (ratios[i] ?? ratios[0] ?? 1.414))}px`;
  });
}

function setCurrent(page: number) {
  if (!pdf) return;
  current = page;
  labelEl.textContent = fill(config.strings.pageOf, page, pdf.numPages);
  storePage(page);
}

async function renderPage(index: number) {
  const holder = holders[index];
  if (!pdf || !holder || holder.dataset.rendered === String(zoom) || tasks.has(index)) return;
  const mine = generation;
  const page = await pdf.getPage(index + 1);
  if (mine !== generation) return;

  const base = page.getViewport({ scale: 1 });
  const ratio = base.height / base.width;
  if (ratios[index] !== ratio) {
    ratios[index] = ratio;
    layout();
  }

  const cssWidth = pageWidth();
  let density = Math.min(window.devicePixelRatio || 1, 2);
  const pixels = cssWidth * density * (cssWidth * ratio * density);
  if (pixels > MAX_CANVAS_PIXELS) density *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
  const viewport = page.getViewport({ scale: (cssWidth * density) / base.width });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const task = page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport });
  tasks.set(index, task);
  try {
    await task.promise;
    if (mine !== generation) return;
    holder.replaceChildren(canvas);
    holder.dataset.rendered = String(zoom);
  } catch (error) {
    // A cancellation (zoom change, new document) is expected: the next pass redraws.
    if ((error as Error)?.name !== 'RenderingCancelledException') console.warn('PDF page render failed', error);
  } finally {
    tasks.delete(index);
  }
}

const nearby = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const index = Number((entry.target as HTMLElement).dataset.index);
      if (entry.isIntersecting) void renderPage(index);
      // Far-away pages give their canvas back; it is redrawn on return.
      else if (!tasks.has(index)) {
        entry.target.replaceChildren();
        delete (entry.target as HTMLElement).dataset.rendered;
      }
    }
  },
  { root: pagesEl, rootMargin: '150% 0px' },
);

function updateCurrentFromScroll() {
  if (holders.length === 0) return;
  const middle = pagesEl.scrollTop + pagesEl.clientHeight / 3;
  let page = 1;
  for (const [i, holder] of holders.entries()) {
    if (holder.offsetTop <= middle) page = i + 1;
    else break;
  }
  if (page !== current) setCurrent(page);
}

function scrollToPage(page: number, smooth = false) {
  const holder = holders[page - 1];
  if (!holder) return;
  pagesEl.scrollTo({ top: holder.offsetTop - 6, behavior: smooth ? 'smooth' : 'auto' });
  setCurrent(page);
}

function showToast(text: string) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  setTimeout(() => (toastEl.hidden = true), 2600);
}

async function load() {
  const mine = ++generation;
  for (const task of tasks.values()) task.cancel();
  tasks.clear();
  nearby.disconnect();
  holders = [];
  ratios = [];
  pagesEl.replaceChildren(statusEl);
  statusEl.hidden = false;
  labelEl.textContent = '';

  const file = variant === 'solution' && config.solution ? config.solution : config.sheet;
  downloadEl.href = file.url;
  downloadEl.download = file.name;
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-variant]')) {
    button.setAttribute('aria-pressed', String(button.dataset.variant === variant));
  }

  try {
    const previous = pdf;
    pdf = null;
    void previous?.destroy();
    // Whole-file requests (no HTTP ranges) so the service worker can cache the PDF.
    const loaded = await pdfjs.getDocument({ url: file.url, disableRange: true, disableStream: true }).promise;
    if (mine !== generation) return void loaded.destroy();
    pdf = loaded;

    const first = (await pdf.getPage(1)).getViewport({ scale: 1 });
    if (mine !== generation) return;
    ratios = Array.from({ length: pdf.numPages }, () => first.height / first.width);
    holders = ratios.map((_, i) => {
      const holder = document.createElement('div');
      holder.className = 'pdf-page';
      holder.dataset.index = String(i);
      return holder;
    });
    statusEl.hidden = true;
    pagesEl.replaceChildren(...holders);
    layout();
    for (const holder of holders) nearby.observe(holder);

    gotoInput.max = String(pdf.numPages);
    const resume = Math.min(readStoredPage(), pdf.numPages);
    scrollToPage(resume);
    if (resume > 1) showToast(fill(config.strings.resumedAt, resume));
  } catch {
    if (mine !== generation) return;
    statusEl.textContent = config.strings.error;
    statusEl.hidden = false;
  }
}

function setZoom(next: number) {
  if (next === zoom || !pdf) return;
  const keep = current;
  zoom = next;
  for (const task of tasks.values()) task.cancel();
  layout();
  scrollToPage(keep);
  // Redraw what is on screen at the new size; the observer handles the rest.
  holders.forEach((holder, i) => {
    if (holder.childElementCount > 0) void renderPage(i);
  });
}

root.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-zoom], [data-variant]');
  if (!target) return;
  if (target.dataset.variant) {
    const next = target.dataset.variant as Variant;
    if (next === variant) return;
    variant = next;
    history.replaceState(null, '', variant === 'solution' ? '?corrige=1' : location.pathname);
    void load();
    return;
  }
  const i = ZOOM_STEPS.indexOf(zoom);
  if (target.dataset.zoom === 'fit') setZoom(1);
  else setZoom(ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, i + (target.dataset.zoom === 'in' ? 1 : -1)))]!);
});

gotoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!pdf || !gotoInput.value) return;
  scrollToPage(Math.max(1, Math.min(pdf.numPages, Math.round(Number(gotoInput.value)))), true);
  gotoInput.value = '';
  pagesEl.focus();
});

pagesEl.addEventListener('scroll', updateCurrentFromScroll, { passive: true });

let resizeTimer: number | undefined;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (!pdf) return;
    const keep = current;
    layout();
    scrollToPage(keep);
    holders.forEach((holder, i) => {
      delete holder.dataset.rendered;
      if (holder.childElementCount > 0) void renderPage(i);
    });
  }, 150);
});

void load();
