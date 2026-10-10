// Browser preview only: the built-in PDF viewer in a frame. It cannot report the
// page being read, so paging is driven from the app's own controls.

import { useEffect, useImperativeHandle, useState } from 'react';
import type { PdfViewProps } from './PdfView';

export type { PdfHandle, PdfViewProps } from './PdfView';

export function PdfView({ uri, pages, initialPage, ref, onPage }: PdfViewProps) {
  const [page, setPage] = useState(initialPage);
  useImperativeHandle(ref, () => ({ goTo: setPage }), []);
  useEffect(() => onPage(page, pages), [page, pages]); // eslint-disable-line react-hooks/exhaustive-deps
  return <iframe key={page} title="PDF" src={`${uri}#page=${page}`} style={{ flex: 1, border: 0, width: '100%', height: '100%' }} />;
}
