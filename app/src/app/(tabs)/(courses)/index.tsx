import { router } from 'expo-router';
import { Check, ChevronDown, WifiOff } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, useWindowDimensions, View } from 'react-native';
import { CourseIcon, ICON_STROKE } from '@/components/CourseIcon';
import { CourseTile } from '@/components/CourseTile';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { T } from '@/components/T';
import { Tap } from '@/components/Tap';
import { isToday, t, when } from '@/i18n';
import { courseFlag, indexDocs, variantRef } from '@/lib/catalog';
import { openDocument } from '@/lib/open';
import { useOnline } from '@/lib/useOnline';
import { CatalogVersionError, useCatalog } from '@/store/catalog';
import { downloadedDocCount, useDownloads } from '@/store/downloads';
import { positionKey, useReading } from '@/store/reading';
import { useSettings } from '@/store/settings';
import { toast } from '@/store/toast';
import { radii, space, TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const GRID_GAP = 12;

/** Pull-to-refresh and "Vérifier maintenant": sync, then say what changed. */
export async function syncAndReport() {
  try {
    const { added, updated } = await useCatalog.getState().sync();
    toast(added + updated > 0 ? t.sync.summary(added, updated) : t.sync.upToDate);
  } catch (e) {
    toast(e instanceof CatalogVersionError ? t.errors.catalogVersion : t.sync.failed);
  }
}

export default function Home() {
  const theme = useTheme();
  const online = useOnline();
  const { width } = useWindowDimensions();
  const { catalog, lastSyncedAt, flags, syncing } = useCatalog();
  const files = useDownloads((s) => s.files);
  const chosen = useSettings((s) => s.semester);
  const setSettings = useSettings((s) => s.set);
  const [picking, setPicking] = useState(false);

  const semesters = (catalog?.years ?? []).flatMap((year) =>
    year.semesters.map((semester) => ({ key: `${year.id}/${semester.id}`, year, semester })),
  );
  // Default to the most recent semester: it is the one being studied.
  const current = semesters.find((s) => s.key === chosen) ?? semesters.at(-1);
  const courses = current?.semester.courses ?? [];

  const contentWidth = Math.min(width, 720) - space.screen * 2;
  const columns = contentWidth >= 560 ? 3 : 2;
  const tileWidth = Math.floor((contentWidth - GRID_GAP * (columns - 1)) / columns);

  const syncLine = syncing
    ? t.sync.inProgress
    : lastSyncedAt === null
      ? t.home.neverSynced
      : !online
        ? t.home.lastSyncedAt(when(lastSyncedAt))
        : isToday(lastSyncedAt)
          ? t.home.syncedAt(when(lastSyncedAt))
          : t.home.lastSyncedAt(when(lastSyncedAt));

  return (
    <Screen refreshControl={<RefreshControl refreshing={syncing} onRefresh={syncAndReport} tintColor={theme.ink} colors={[theme.ink]} progressBackgroundColor={theme.surface} />}>
      {current ? (
        <Tap
          disabled={semesters.length < 2}
          onPress={() => setPicking(true)}
          label={t.home.chooseSemester}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: semesters.length < 2 ? undefined : TOUCH, alignSelf: 'flex-start' }}
          dimWhenDisabled={false}>
          <T variant="mono" color={theme.ink2}>
            {current.year.label} · {current.semester.label}
          </T>
          {semesters.length > 1 ? <ChevronDown color={theme.ink2} size={16} strokeWidth={2} /> : null}
        </Tap>
      ) : null}
      <T variant="screenTitle" accessibilityRole="header" style={{ marginTop: 4 }}>
        {t.home.title}
      </T>
      <T variant="caption" color={theme.ink3} style={{ marginTop: 6 }}>
        {syncLine}
      </T>

      {!online ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.ink, borderRadius: radii.tile, padding: 12, marginTop: space.gap }}>
          <WifiOff color={theme.onInk} size={20} strokeWidth={ICON_STROKE} />
          <T variant="bodyStrong" color={theme.onInk} style={{ flex: 1 }}>
            {t.offline.banner}
          </T>
        </View>
      ) : null}

      <ContinueReading />

      {catalog === null ? (
        <View style={{ marginTop: 40, alignItems: 'center', gap: 14 }}>
          <T color={theme.ink2} style={{ textAlign: 'center' }}>
            {syncing ? t.common.loading : t.errors.catalog}
          </T>
          {!syncing ? (
            <Tap onPress={syncAndReport} style={{ minHeight: TOUCH, paddingHorizontal: 22, justifyContent: 'center', borderRadius: radii.pill, backgroundColor: theme.ink }}>
              <T variant="bodyStrong" color={theme.onInk}>
                {t.common.retry}
              </T>
            </Tap>
          ) : null}
        </View>
      ) : (
        <>
          <T variant="cardTitle" accessibilityRole="header" style={{ marginTop: space.section, marginBottom: 12 }}>
            {t.home.myCourses}
          </T>
          {courses.length === 0 ? (
            <View>
              <T color={theme.ink2}>{t.home.empty}</T>
              <T variant="caption" color={theme.ink3} style={{ marginTop: 4 }}>
                {t.home.emptyHint}
              </T>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
              {courses.map((course) => {
                const offlineCount = downloadedDocCount(course, files);
                return (
                  <CourseTile
                    key={course.id}
                    course={course}
                    width={tileWidth}
                    offlineCount={offlineCount}
                    flag={courseFlag(course, flags)}
                    unavailable={!online && offlineCount === 0}
                    onPress={() => {
                      const [year, semester, slug] = course.id.split('/') as [string, string, string];
                      router.push({ pathname: '/course/[year]/[semester]/[course]', params: { year, semester, course: slug } });
                    }}
                  />
                );
              })}
            </View>
          )}
        </>
      )}

      <Sheet visible={picking} title={t.home.chooseSemester} onClose={() => setPicking(false)}>
        {semesters.map((s) => {
          const active = s.key === current?.key;
          return (
            <Tap
              key={s.key}
              onPress={() => {
                setSettings({ semester: s.key });
                setPicking(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, borderTopWidth: 1, borderTopColor: theme.rowLine }}>
              <T variant="rowTitle" style={{ flex: 1 }}>
                {s.year.label} · {s.semester.label}
              </T>
              {active ? <Check color={theme.ink} size={22} strokeWidth={2.2} /> : null}
            </Tap>
          );
        })}
      </Sheet>
    </Screen>
  );
}

function ContinueReading() {
  const theme = useTheme();
  const catalog = useCatalog((s) => s.catalog);
  const last = useReading((s) => s.last);
  const positions = useReading((s) => s.positions);
  if (!last) return null;
  const entry = indexDocs(catalog).get(last.docId);
  const position = positions[positionKey(last.docId, last.variant)];
  if (!entry || !position) return null;

  const { doc, course, section } = entry;
  const pages = variantRef(doc, last.variant).pages;
  const page = Math.min(position.page, pages);
  return (
    <Tap
      onPress={() => openDocument(doc, last.variant)}
      style={{ backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.line, padding: 14, marginTop: space.gap, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: radii.tile, backgroundColor: course.accent, alignItems: 'center', justifyContent: 'center' }}>
          <CourseIcon name={course.icon} color={course.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <T variant="mono" color={theme.ink3}>
            {t.home.continueReading}
          </T>
          <T variant="cardTitle" numberOfLines={1}>
            {doc.title}
          </T>
          <T variant="caption" color={theme.ink2} numberOfLines={2}>
            {t.home.continueMeta(course.name, last.variant === 'solution' ? t.document.withSolution : t.sections[section], page, pages)}
          </T>
        </View>
      </View>
      <ProgressBar value={page / pages} color={course.accent} track={theme.rowLine} />
    </Tap>
  );
}
