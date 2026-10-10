import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@/i18n';
import { radii, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { T } from './T';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet for short choices and inputs. */
export function Sheet({ visible, title, onClose, children }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel={t.common.close}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
        />
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: radii.hero,
            borderTopRightRadius: radii.hero,
            padding: space.screen,
            paddingBottom: insets.bottom + space.screen,
            maxHeight: '80%',
          }}>
          <T variant="cardTitle" style={{ marginBottom: 14 }}>
            {title}
          </T>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
