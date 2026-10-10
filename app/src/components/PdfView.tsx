import type { Ref } from 'react';
import { useImperativeHandle, useRef } from 'react';
import Pdf, { type PdfRef } from 'react-native-pdf';
import { reader } from '@/theme/tokens';

export interface PdfHandle {
  goTo: (page: number) => void;
}

export interface PdfViewProps {
  uri: string;
  /** Page count from the catalog, used until the file reports its own. */
  pages: number;
  initialPage: number;
  ref?: Ref<PdfHandle>;
  onPage: (page: number, pages: number) => void;
  onError: () => void;
}

/** Native PDF renderer: vertical scroll, pinch and double-tap zoom. */
export function PdfView({ uri, initialPage, ref, onPage, onError }: PdfViewProps) {
  const pdf = useRef<PdfRef>(null);
  useImperativeHandle(ref, () => ({ goTo: (page) => pdf.current?.setPage(page) }), []);
  return (
    <Pdf
      ref={pdf}
      source={{ uri }}
      page={initialPage}
      fitPolicy={0}
      minScale={1}
      maxScale={5}
      spacing={10}
      enableDoubleTapZoom
      enableAntialiasing
      trustAllCerts={false}
      onLoadComplete={(pages) => onPage(Math.min(initialPage, pages), pages)}
      onPageChanged={onPage}
      onError={onError}
      style={{ flex: 1, backgroundColor: reader.bg }}
    />
  );
}
