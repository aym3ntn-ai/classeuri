import type { CatalogCourse } from '@classeuri/shared';
import { View } from 'react-native';
import type { Flag } from '@/lib/catalog';
import { t } from '@/i18n';
import { useTheme } from '@/theme/useTheme';
import { Badge } from './Badge';
import { CourseIcon } from './CourseIcon';
import { T } from './T';
import { Tap } from './Tap';

interface Props {
  course: CatalogCourse;
  width: number;
  offlineCount: number;
  flag: Flag | null;
  /** Offline with nothing downloaded: the tile turns grey and dashed. */
  unavailable: boolean;
  onPress: () => void;
}

export function CourseTile({ course, width, offlineCount, flag, unavailable, onPress }: Props) {
  const theme = useTheme();
  const text = unavailable ? theme.ink3 : course.onAccent;
  return (
    <Tap
      onPress={onPress}
      label={course.name}
      style={{
        width,
        height: 176,
        borderRadius: 18,
        padding: 14,
        justifyContent: 'space-between',
        backgroundColor: unavailable ? theme.muted : course.accent,
        borderWidth: unavailable ? 1.5 : 0,
        borderStyle: 'dashed',
        borderColor: theme.ink3,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <CourseIcon name={course.icon} color={text} size={26} />
        {flag && !unavailable ? <Badge flag={flag} onAccent /> : null}
      </View>
      <View>
        <T variant="mono" color={text} style={{ opacity: 0.85 }}>
          {course.code}
        </T>
        <T variant="cardTitle" color={text} numberOfLines={2} style={{ marginTop: 2 }}>
          {course.name}
        </T>
        <T variant="caption" color={text} numberOfLines={1} style={{ marginTop: 4, opacity: 0.9 }}>
          {unavailable ? t.home.needsInternet : t.home.tileMeta(course.documentCount, offlineCount)}
        </T>
      </View>
    </Tap>
  );
}
