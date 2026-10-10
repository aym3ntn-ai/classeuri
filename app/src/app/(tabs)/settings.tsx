import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';
import { Switch, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Sheet } from '@/components/Sheet';
import { T } from '@/components/T';
import { Tap } from '@/components/Tap';
import { size, t, when } from '@/i18n';
import { isValidSource } from '@/lib/catalog';
import { confirmDestructive } from '@/lib/confirm';
import { useCatalog } from '@/store/catalog';
import { totalDownloadedSize, useDownloads } from '@/store/downloads';
import { useSettings, type ThemeChoice } from '@/store/settings';
import { radii, space, TOUCH } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { syncAndReport } from './(courses)/index';

export default function Settings() {
  const theme = useTheme();
  const settings = useSettings();
  const { lastSyncedAt, syncing } = useCatalog();
  const files = useDownloads((s) => s.files);
  const removeAll = useDownloads((s) => s.removeAll);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const total = totalDownloadedSize(files);
  const draftValid = isValidSource(draft);

  const saveSource = () => {
    const next = `${draft.trim().replace(/\/+$/, '')}/`;
    setEditing(false);
    if (next === settings.sourceUrl) return;
    // Another source is another library: its documents share no ids with this one.
    settings.set({ sourceUrl: next, semester: null });
    useCatalog.getState().reset();
    syncAndReport();
  };

  const toggle = (label: string, hint: string, value: boolean, onChange: (v: boolean) => void, first = false) => (
    <Row first={first}>
      <View style={{ flex: 1 }}>
        <T variant="rowTitle">{label}</T>
        <T variant="caption" color={theme.ink3}>
          {hint}
        </T>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: theme.line, true: theme.ink }}
        thumbColor={value ? theme.onInk : theme.surface}
      />
    </Row>
  );

  return (
    <Screen>
      <T variant="screenTitle" accessibilityRole="header">
        {t.settings.title}
      </T>

      <Section title={t.settings.content}>
        <Tap
          onPress={() => {
            setDraft(settings.sourceUrl);
            setEditing(true);
          }}
          label={t.settings.sourceEdit}>
          <Row first>
            <View style={{ flex: 1 }}>
              <T variant="rowTitle">{t.settings.source}</T>
              <T variant="caption" color={theme.ink3} numberOfLines={1}>
                {settings.sourceUrl.replace(/^https:\/\//, '').replace(/\/$/, '')}
              </T>
            </View>
          </Row>
        </Tap>
        <Row>
          <View style={{ flex: 1 }}>
            <T variant="rowTitle">{t.settings.lastSynced}</T>
            <T variant="caption" color={theme.ink3}>
              {syncing ? t.sync.inProgress : lastSyncedAt === null ? t.settings.never : when(lastSyncedAt)}
            </T>
          </View>
          <Tap
            disabled={syncing}
            onPress={syncAndReport}
            style={{ minHeight: TOUCH, paddingHorizontal: 16, justifyContent: 'center', borderRadius: radii.pill, backgroundColor: theme.ink }}>
            <T variant="bodyStrong" color={theme.onInk}>
              {t.settings.checkNow}
            </T>
          </Tap>
        </Row>
      </Section>

      <Section title={t.settings.downloads}>
        {toggle(t.settings.autoUpdate, t.settings.autoUpdateHint, settings.autoUpdate, (autoUpdate) => settings.set({ autoUpdate }), true)}
        {toggle(t.settings.wifiOnly, t.settings.wifiOnlyHint, settings.wifiOnly, (wifiOnly) => settings.set({ wifiOnly }))}
      </Section>

      <Section title={t.settings.storage}>
        <Tap
          disabled={total === 0}
          onPress={() => confirmDestructive(t.settings.removeAllTitle, t.settings.removeAllBody(size(total)), t.common.remove, removeAll)}>
          <Row first>
            <T variant="rowTitle" color={theme.danger} style={{ flex: 1 }}>
              {t.settings.removeAll}
            </T>
            <T variant="mono" color={theme.ink3}>
              {size(total)}
            </T>
          </Row>
        </Tap>
      </Section>

      <Section title={t.settings.appearance}>
        <View style={{ padding: 10 }}>
          <Segmented<ThemeChoice>
            value={settings.theme}
            onChange={(theme) => settings.set({ theme })}
            options={[
              { value: 'system', label: t.settings.themeSystem },
              { value: 'light', label: t.settings.themeLight },
              { value: 'dark', label: t.settings.themeDark },
            ]}
            colors={{ track: theme.bg, thumb: theme.ink, text: theme.ink2, activeText: theme.onInk }}
          />
        </View>
      </Section>

      <T variant="mono" color={theme.ink3} style={{ textAlign: 'center', marginTop: space.section }}>
        {t.app.name} · {t.settings.version(Constants.expoConfig?.version ?? '')}
      </T>

      <Sheet visible={editing} title={t.settings.source} onClose={() => setEditing(false)}>
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => draftValid && saveSource()}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          accessibilityLabel={t.settings.source}
          style={{ minHeight: 48, borderRadius: radii.tile, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.bg, paddingHorizontal: 14, color: theme.ink, fontFamily: 'SchibstedGrotesk_400Regular', fontSize: 15 }}
        />
        {draft && !draftValid ? (
          <T variant="caption" color={theme.danger} style={{ marginTop: 8 }}>
            {t.settings.sourceInvalid}
          </T>
        ) : null}
        <Tap
          disabled={!draftValid}
          onPress={saveSource}
          style={{ marginTop: 14, minHeight: 48, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.ink }}>
          <T variant="bodyStrong" color={theme.onInk}>
            {t.common.confirm}
          </T>
        </Tap>
      </Sheet>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: space.section }}>
      <T variant="mono" color={theme.ink2} accessibilityRole="header" style={{ marginBottom: 8, paddingHorizontal: 2 }}>
        {title}
      </T>
      <View style={{ backgroundColor: theme.surface, borderRadius: radii.card, borderWidth: 1, borderColor: theme.line, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

function Row({ children, first }: { children: ReactNode; first?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: theme.rowLine }}>
      {children}
    </View>
  );
}
