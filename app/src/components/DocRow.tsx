import type { CatalogDocument } from '@classeuri/shared';
import { ArrowDownToLine, CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';
import { size, t } from '@/i18n';
import { docFiles, type Flag, type Variant } from '@/lib/catalog';
import { confirmDestructive } from '@/lib/confirm';
import { openDocument } from '@/lib/open';
import { docProgress, downloadMany, isDocDownloaded, useDownloads } from '@/store/downloads';
import { toast } from '@/store/toast';
import { radii, TOUCH, tint } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Badge } from './Badge';
import { ICON_STROKE } from './CourseIcon';
import { T } from './T';
import { Tap } from './Tap';

interface Props {
  doc: CatalogDocument;
  accent: string;
  flag?: Flag;
  first: boolean;
}

/** One document of a course: opens on tap, with its download state on the right. */
export function DocRow({ doc, accent, flag, first }: Props) {
  const theme = useTheme();
  const files = useDownloads((s) => s.files);
  const progress = useDownloads((s) => s.progress);
  const remove = useDownloads((s) => s.remove);

  const downloaded = isDocDownloaded(doc, files);
  const transfer = docProgress(doc, progress, files);
  const totalSize = docFiles(doc).reduce((sum, f) => sum + f.size, 0);

  const meta =
    transfer !== null
      ? t.document.downloading(Math.round(transfer * 100))
      : `${doc.solution ? size(totalSize) : t.document.meta(doc.pages, size(doc.size))} · ${downloaded ? t.document.onPhone : t.document.tapToDownload}`;

  const onStatusPress = async () => {
    if (transfer !== null) return;
    if (downloaded) {
      confirmDestructive(doc.title, t.downloads.removeCourseBody, t.document.removeDownload, () => remove(docFiles(doc).map((f) => f.path)));
    } else if ((await downloadMany(docFiles(doc))) > 0) {
      toast(t.errors.download);
    }
  };

  const chip = (variant: Variant, label: string, pages: number) => (
    <Tap
      onPress={() => openDocument(doc, variant)}
      style={{ minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radii.chip, backgroundColor: tint(accent, theme.surface), borderWidth: 1, borderColor: theme.rowLine }}>
      <T variant="caption" style={{ fontFamily: 'SchibstedGrotesk_600SemiBold' }}>
        {label} · {t.common.pagesShort(pages)}
      </T>
    </Tap>
  );

  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: theme.rowLine, paddingVertical: 10, paddingLeft: 14, paddingRight: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Tap onPress={() => openDocument(doc)} style={{ flex: 1, minHeight: TOUCH, justifyContent: 'center', gap: 2 }}>
          <T variant="rowTitle">{doc.title}</T>
          <T variant="caption" color={theme.ink3}>
            {meta}
          </T>
          {flag ? (
            <View style={{ marginTop: 4 }}>
              <Badge flag={flag} />
            </View>
          ) : null}
        </Tap>
        <Tap
          onPress={onStatusPress}
          label={downloaded ? t.document.removeDownload : t.common.download}
          style={{ width: TOUCH + 4, height: TOUCH + 4, alignItems: 'center', justifyContent: 'center' }}>
          {transfer !== null ? (
            <T variant="mono" color={theme.ink2}>
              {Math.round(transfer * 100)}%
            </T>
          ) : downloaded ? (
            <CircleCheck color={theme.ink} size={24} strokeWidth={ICON_STROKE} />
          ) : (
            <ArrowDownToLine color={theme.ink3} size={24} strokeWidth={ICON_STROKE} />
          )}
        </Tap>
      </View>
      {doc.solution ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 4 }}>
          {chip('sheet', t.document.withoutSolution, doc.pages)}
          {chip('solution', t.document.withSolution, doc.solution.pages)}
        </View>
      ) : null}
    </View>
  );
}
