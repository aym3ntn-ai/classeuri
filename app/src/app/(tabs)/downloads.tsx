import type { CatalogCourse } from '@classeuri/shared';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge } from '@/components/Badge';
import { Screen } from '@/components/Screen';
import { T } from '@/components/T';
import { Tap } from '@/components/Tap';
import { size, t } from '@/i18n';
import { allCourses, courseFiles, docFiles } from '@/lib/catalog';
import { confirmDestructive } from '@/lib/confirm';
import { openDocument } from '@/lib/open';
import { useCatalog } from '@/store/catalog';
import { downloadedSize, totalDownloadedSize, useDownloads } from '@/store/downloads';
import { radii, space, TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PREVIEW = 3;

export default function Downloads() {
  const theme = useTheme();
  const catalog = useCatalog((s) => s.catalog);
  const files = useDownloads((s) => s.files);

  const groups = allCourses(catalog)
    .map((course) => ({ course, bytes: downloadedSize(course, files) }))
    .filter((g) => g.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);
  const total = totalDownloadedSize(files);
  // Several courses can share an accent; the legend still tells them apart.
  const [open, setOpen] = useState<string | null>(null);
  const openId = open ?? groups[0]?.course.id;

  return (
    <Screen>
      <T variant="screenTitle" accessibilityRole="header">
        {t.downloads.title}
      </T>
      <T variant="caption" color={theme.ink3} style={{ marginTop: 6 }}>
        {t.downloads.subtitle}
      </T>

      {groups.length === 0 ? (
        <View style={{ marginTop: 48, alignItems: 'center', gap: 6 }}>
          <T variant="cardTitle">{t.downloads.empty}</T>
          <T color={theme.ink2} style={{ textAlign: 'center' }}>
            {t.downloads.emptyHint}
          </T>
        </View>
      ) : (
        <>
          <View style={{ backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.line, padding: 16, marginTop: space.gap }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <T variant="hero">{size(total)}</T>
              <T variant="caption" color={theme.ink2}>
                {t.downloads.onThisPhone}
              </T>
            </View>
            <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 12, gap: 2 }}>
              {groups.map((g) => (
                <View key={g.course.id} style={{ flex: g.bytes, backgroundColor: g.course.accent }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4, marginTop: 10 }}>
              {groups.map((g) => (
                <View key={g.course.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: g.course.accent }} />
                  <T variant="caption" color={theme.ink2}>
                    {g.course.name} {size(g.bytes)}
                  </T>
                </View>
              ))}
            </View>
          </View>

          {groups.map((g) => (
            <Group
              key={g.course.id}
              course={g.course}
              bytes={g.bytes}
              expanded={g.course.id === openId}
              onToggle={() => setOpen(g.course.id === openId ? '' : g.course.id)}
            />
          ))}
        </>
      )}
    </Screen>
  );
}

function Group({ course, bytes, expanded, onToggle }: { course: CatalogCourse; bytes: number; expanded: boolean; onToggle: () => void }) {
  const theme = useTheme();
  const files = useDownloads((s) => s.files);
  const remove = useDownloads((s) => s.remove);
  const flags = useCatalog((s) => s.flags);
  const [showAll, setShowAll] = useState(false);

  // One row per document that has at least one of its PDFs on the phone.
  const rows = course.sections.flatMap((section) =>
    section.documents
      .map((doc) => ({ doc, section: section.kind, local: docFiles(doc).filter((f) => files[f.path]) }))
      .filter((r) => r.local.length > 0),
  );
  const fileCount = rows.reduce((n, r) => n + r.local.length, 0);
  const visible = showAll ? rows : rows.slice(0, PREVIEW);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radii.card, borderWidth: 1, borderColor: theme.line, marginTop: space.gap, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 6 }}>
        <Tap onPress={onToggle} accessibilityState={{ expanded }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60 }}>
          <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: course.accent }} />
          <View style={{ flex: 1 }}>
            <T variant="cardTitle" numberOfLines={1}>
              {course.name}
            </T>
            <T variant="caption" color={theme.ink3}>
              {t.downloads.groupMeta(size(bytes), fileCount)}
            </T>
          </View>
          <Chevron color={theme.ink3} size={20} strokeWidth={2} />
        </Tap>
        {expanded ? (
          <Tap
            onPress={() =>
              confirmDestructive(t.downloads.removeCourseTitle(course.name), t.downloads.removeCourseBody, t.common.remove, () =>
                remove(courseFiles(course).map((f) => f.path)),
              )
            }
            style={{ minHeight: TOUCH, paddingHorizontal: 10, justifyContent: 'center' }}>
            <T variant="bodyStrong" color={theme.danger}>
              {t.common.remove}
            </T>
          </Tap>
        ) : null}
      </View>

      {expanded ? (
        <>
          {visible.map(({ doc, section, local }) => (
            <Tap
              key={doc.id}
              onPress={() => openDocument(doc, files[doc.path] ? 'sheet' : 'solution')}
              style={{ borderTopWidth: 1, borderTopColor: theme.rowLine, paddingHorizontal: 14, paddingVertical: 10, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T variant="rowTitle" numberOfLines={1}>
                  {doc.title}
                </T>
                <T variant="caption" color={theme.ink3} numberOfLines={1}>
                  {[t.sections[section], local.length > 1 ? t.document.bothVersions : null, size(local.reduce((sum, f) => sum + (files[f.path]?.size ?? 0), 0))]
                    .filter(Boolean)
                    .join(' · ')}
                </T>
              </View>
              {flags[doc.id] ? <Badge flag={flags[doc.id]!} /> : null}
            </Tap>
          ))}
          {rows.length > PREVIEW ? (
            <Tap onPress={() => setShowAll(!showAll)} style={{ borderTopWidth: 1, borderTopColor: theme.rowLine, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
              <T variant="bodyStrong" color={theme.ink2}>
                {showAll ? t.downloads.showLess : t.downloads.showMore(rows.length - PREVIEW)}
              </T>
            </Tap>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
