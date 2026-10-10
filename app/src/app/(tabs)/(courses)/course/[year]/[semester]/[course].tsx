import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { DocRow } from '@/components/DocRow';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { T } from '@/components/T';
import { Tap } from '@/components/Tap';
import { size, t } from '@/i18n';
import { allCourses, courseFiles } from '@/lib/catalog';
import { canBulkDownload, useCatalog } from '@/store/catalog';
import { downloadedDocCount, downloadedSize, downloadMany, useDownloads } from '@/store/downloads';
import { toast } from '@/store/toast';
import { radii, space, TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function CourseScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ year: string; semester: string; course: string }>();
  const catalog = useCatalog((s) => s.catalog);
  const flags = useCatalog((s) => s.flags);
  const files = useDownloads((s) => s.files);
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);

  const course = allCourses(catalog).find((c) => c.id === `${params.year}/${params.semester}/${params.course}`);
  const semesterLabel = catalog?.years.find((y) => y.id === params.year)?.semesters.find((s) => s.id === params.semester)?.label;

  const back = (
    <Tap onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', minHeight: TOUCH, alignSelf: 'flex-start', marginLeft: -6, paddingRight: 10 }}>
      <ChevronLeft color={theme.ink} size={24} strokeWidth={2} />
      <T variant="bodyStrong">{t.tabs.courses}</T>
    </Tap>
  );

  if (!course) {
    return (
      <Screen>
        {back}
        <T color={theme.ink2} style={{ marginTop: 24 }}>
          {t.course.notFound}
        </T>
      </Screen>
    );
  }

  const onPhone = downloadedDocCount(course, files);
  const complete = onPhone === course.documentCount;
  const fg = course.onAccent;
  const track = fg === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(17,21,28,0.2)';

  const downloadAll = async () => {
    if (!(await canBulkDownload())) {
      toast(t.errors.wifiRequired);
      return;
    }
    const missing = courseFiles(course).filter((f) => !useDownloads.getState().files[f.path]);
    setBulk({ done: 0, total: missing.length });
    let failed = 0;
    for (const [i, ref] of missing.entries()) {
      failed += await downloadMany([ref]);
      setBulk({ done: i + 1, total: missing.length });
    }
    setBulk(null);
    if (failed > 0) toast(t.errors.download);
  };

  return (
    <Screen>
      {back}

      <View style={{ backgroundColor: course.accent, borderRadius: radii.hero, padding: 20, marginTop: 6 }}>
        <T variant="mono" color={fg} style={{ opacity: 0.85 }}>
          {[course.code, semesterLabel].filter(Boolean).join(' · ')}
        </T>
        <T variant="hero" color={fg} accessibilityRole="header" style={{ marginTop: 6 }}>
          {course.name}
        </T>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 14, marginBottom: 8 }}>
          <T variant="caption" color={fg} style={{ flex: 1 }}>
            {t.course.onPhone(onPhone, course.documentCount)}
          </T>
          <T variant="caption" color={fg}>
            {size(downloadedSize(course, files))}
          </T>
        </View>
        <ProgressBar value={onPhone / course.documentCount} color={fg} track={track} />
        <Tap
          disabled={complete || bulk !== null}
          onPress={downloadAll}
          style={{ marginTop: 16, minHeight: 48, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
          <T variant="bodyStrong" color="#11151C" style={{ fontFamily: 'SchibstedGrotesk_700Bold', fontSize: 15 }}>
            {bulk ? t.course.downloadingAll(bulk.done, bulk.total) : complete ? t.course.allDownloaded : t.course.downloadAll}
          </T>
        </Tap>
      </View>

      {course.sections.map((section) => (
        <View key={section.kind} style={{ marginTop: space.section }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
            <T variant="mono" color={theme.ink2} accessibilityRole="header">
              {t.sections[section.kind]}
            </T>
            <T variant="mono" color={theme.ink3}>
              {String(section.documents.length).padStart(2, '0')}
            </T>
          </View>
          <View style={{ backgroundColor: theme.surface, borderRadius: radii.card, borderWidth: 1, borderColor: theme.line, overflow: 'hidden' }}>
            {section.documents.map((doc, i) => (
              <DocRow key={doc.id} doc={doc} accent={course.accent} flag={flags[doc.id]} first={i === 0} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
