import { Alert, Platform } from 'react-native';
import { t } from '@/i18n';

/** Asks before a destructive action. */
export function confirmDestructive(title: string, body: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${body}`)) onConfirm();
    return;
  }
  Alert.alert(title, body, [
    { text: t.common.cancel, style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}
