import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Hash, LayoutGrid } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICON_STROKE } from '@/components/CourseIcon';
import { PdfView, type PdfHandle } from '@/components/PdfView';
import { ProgressBar } from '@/components/ProgressBar';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { T } from '@/components/T';
import { Tap } from '@/components/Tap';
import { t } from '@/i18n';
import { indexDocs, variantRef, type Variant } from '@/lib/catalog';
import { fileExists } from '@/lib/files';
import { useCatalog } from '@/store/catalog';
import { useDownloads } from '@/store/downloads';
import { positionKey, useReading } from '@/store/reading';
import { radii, reader, TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Viewer() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; variant?: Variant }>();
  // Select the catalog itself: a store selector must not build a new object per call.
  const catalog = useCatalog((s) => s.catalog);
  const entry = indexDocs(catalog).get(params.id);
  const [variant, setVariant] = useState<Variant>(params.variant === 'solution' ? 'solution' : 'sheet');

  const back = (
    <Tap
      onPress={() => router.back()}
      label={t.common.back}
      style={{ width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: reader.chrome, alignItems: 'center', justifyContent: 'center' }}>
      <ChevronLeft color={reader.text} size={24} strokeWidth={2} />
    </Tap>
  );

  if (!entry) {
    return (
      <View style={{ flex: 1, backgroundColor: reader.bg, paddingTop: insets.top + 10, paddingHorizontal: 14 }}>
        <StatusBar style="light" />
        {back}
        <T color={reader.text2} style={{ marginTop: 24, textAlign: 'center' }}>
          {t.viewer.notFound}
        </T>
      </View>
    );
  }

  const { doc, course, section } = entry;
  return (
    <View style={{ flex: 1, backgroundColor: reader.bg }}>
      <StatusBar style="light" />
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 14, paddingBottom: 10, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {back}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <T variant="bodyStrong" color={reader.text} numberOfLines={1}>
              {doc.title}
            </T>
            <T variant="caption" color={reader.text2} numberOfLines={1}>
              {course.name} · {t.sections[section]}
            </T>
          </View>
          {/* Keeps the title centered against the back button. */}
          <View style={{ width: TOUCH }} />
        </View>
        {doc.solution ? (
          <Segmented
            value={variant}
            onChange={setVariant}
            options={[
              { value: 'sheet', label: t.document.withoutSolution },
              { value: 'solution', label: t.document.withSolution },
            ]}
            colors={{ track: reader.chrome, thumb: '#FFFFFF', text: reader.text2, activeText: '#11151C' }}
          />
        ) : null}
      </View>
      {/* Remounted per variant: each PDF has its own file, page count and last page. */}
      <Reader key={variant} docId={doc.id} variant={variant} />
    </View>
  );
}

function Reader({ docId, variant }: { docId: string; variant: Variant }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const catalog = useCatalog((s) => s.catalog);
  const doc = indexDocs(catalog).get(docId)!.doc;
  const ref = variantRef(doc, variant);
  const local = useDownloads((s) => s.files[ref.path]);
  const transfer = useDownloads((s) => s.progress[ref.path]);

  const pdf = useRef<PdfHandle>(null);
  // Read once: the page to reopen at must not follow the reader around.
  const [startPage] = useState(() => Math.min(useReading.getState().positions[positionKey(docId, variant)]?.page ?? 1, ref.pages));
  const [page, setPage] = useState(startPage);
  const [pages, setPages] = useState(ref.pages);
  const [failed, setFailed] = useState<'download' | 'pdf' | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [resumed, setResumed] = useState(startPage > 1);
  const [sheet, setSheet] = useState<'grid' | 'goto' | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    useCatalog.getState().clearFlag(docId);
  }, [docId]);

  // Fetch the file when it is not on the phone, or when its entry outlived the file.
  useEffect(() => {
    const downloads = useDownloads.getState();
    const known = downloads.files[ref.path];
    if (known && fileExists(known.uri)) return;
    if (known) downloads.remove([ref.path]);
    downloads.download(ref).catch(() => setFailed('download'));
  }, [ref.path, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!resumed) return;
    const timer = setTimeout(() => setResumed(false), 2600);
    return () => clearTimeout(timer);
  }, [resumed]);

  const onPage = (next: number, total: number) => {
    setPage(next);
    setPages(total);
    useReading.getState().setPosition(docId, variant, { page: next, pages: total });
  };

  const goTo = (target: number) => {
    const clamped = Math.max(1, Math.min(pages, target));
    pdf.current?.goTo(clamped);
    setSheet(null);
    setInput('');
  };

  const footerButton = (label: string, Icon: typeof Hash, onPress: () => void) => (
    <Tap
      onPress={onPress}
      disabled={!local}
      style={{ flex: 1, minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radii.tile, backgroundColor: reader.chrome }}>
      <Icon color={reader.text} size={20} strokeWidth={ICON_STROKE} />
      <T variant="bodyStrong" color={reader.text}>
        {label}
      </T>
    </Tap>
  );

  return (
    <>
      <View style={{ flex: 1 }}>
        {failed ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
            <T color={reader.text2} style={{ textAlign: 'center' }}>
              {failed === 'pdf' ? t.errors.pdf : t.errors.download}
            </T>
            <Tap
              onPress={() => {
                if (failed === 'pdf') useDownloads.getState().remove([ref.path]);
                setFailed(null);
                setAttempt((n) => n + 1);
              }}
              style={{ minHeight: TOUCH, paddingHorizontal: 22, justifyContent: 'center', borderRadius: radii.pill, backgroundColor: '#FFFFFF' }}>
              <T variant="bodyStrong" color="#11151C">
                {t.common.retry}
              </T>
            </Tap>
          </View>
        ) : local ? (
          <PdfView ref={pdf} uri={local.uri} pages={ref.pages} initialPage={startPage} onPage={onPage} onError={() => setFailed('pdf')} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <ActivityIndicator color={reader.text} />
            <T color={reader.text2}>{transfer === undefined ? t.viewer.loading : t.document.downloading(Math.round(transfer * 100))}</T>
          </View>
        )}

        <View pointerEvents="none" style={{ position: 'absolute', top: 10, right: 14, backgroundColor: reader.footer, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
          <T variant="mono" color={reader.text}>
            {t.viewer.pageOf(page, pages)}
          </T>
        </View>
        {resumed && local ? (
          <View pointerEvents="none" style={{ position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 9 }}>
              <T variant="bodyStrong" color="#11151C">
                {t.viewer.resumedAt(startPage)}
              </T>
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ backgroundColor: reader.footer, paddingHorizontal: 14, paddingTop: 12, paddingBottom: insets.bottom + 12, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <T variant="mono" color={reader.text2}>
            {t.viewer.pageShort(page)}
          </T>
          <View style={{ flex: 1 }}>
            <ProgressBar value={page / pages} color="#FFFFFF" track={reader.chrome} />
          </View>
          <T variant="mono" color={reader.text2}>
            {pages}
          </T>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {footerButton(t.viewer.allPages, LayoutGrid, () => setSheet('grid'))}
          {footerButton(t.viewer.goToPage, Hash, () => setSheet('goto'))}
        </View>
      </View>

      <Sheet visible={sheet === 'grid'} title={t.viewer.allPages} onClose={() => setSheet(null)}>
        <FlatList
          data={Array.from({ length: pages }, (_, i) => i + 1)}
          keyExtractor={String}
          numColumns={5}
          initialScrollIndex={Math.floor((page - 1) / 5)}
          getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = item === page;
            return (
              <Tap
                onPress={() => goTo(item)}
                label={t.viewer.pageShort(item)}
                style={{ flex: 1, maxWidth: '18.4%', height: 48, marginBottom: 8, borderRadius: radii.chip, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? theme.ink : theme.bg, borderWidth: 1, borderColor: active ? theme.ink : theme.line }}>
                <T variant="mono" color={active ? theme.onInk : theme.ink} style={{ fontSize: 14 }}>
                  {item}
                </T>
              </Tap>
            );
          }}
        />
      </Sheet>

      <Sheet visible={sheet === 'goto'} title={t.viewer.goToPage} onClose={() => setSheet(null)}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            autoFocus
            value={input}
            onChangeText={(text) => setInput(text.replace(/\D/g, ''))}
            onSubmitEditing={() => input && goTo(Number(input))}
            keyboardType="number-pad"
            returnKeyType="go"
            placeholder={t.viewer.goToPagePrompt(pages)}
            placeholderTextColor={theme.ink3}
            accessibilityLabel={t.viewer.goToPagePrompt(pages)}
            style={{ flex: 1, minHeight: 48, borderRadius: radii.tile, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.bg, paddingHorizontal: 14, color: theme.ink, fontFamily: 'IBMPlexMono_500Medium', fontSize: 16 }}
          />
          <Tap
            disabled={!input}
            onPress={() => goTo(Number(input))}
            style={{ minHeight: 48, paddingHorizontal: 22, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.ink }}>
            <T variant="bodyStrong" color={theme.onInk}>
              {t.viewer.go}
            </T>
          </Tap>
        </View>
      </Sheet>
    </>
  );
}
