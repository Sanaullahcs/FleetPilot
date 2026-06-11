import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@/components/ui/icons';
import { Colors } from '@/constants/theme';
import { useSweetAlertStore, type SweetAlertType } from '@/store/sweet-alert';

const palette: Record<SweetAlertType, { bg: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { bg: '#DCFCE7', icon: 'checkmark-circle', color: '#15803D' },
  error: { bg: Colors.dangerLight, icon: 'close-circle', color: Colors.danger },
  warning: { bg: '#FEF3C7', icon: 'warning', color: Colors.warning },
  info: { bg: Colors.primaryLight, icon: 'information-circle', color: Colors.primary },
  confirm: { bg: Colors.accentLight, icon: 'help-circle', color: Colors.accentDark },
};

export function SweetAlertHost() {
  const state = useSweetAlertStore();
  const type = state.type ?? 'info';
  const theme = palette[type];

  const close = () => {
    state.onCancel?.();
    state.hide();
  };

  const confirm = () => {
    void (async () => {
      try {
        await state.onConfirm?.();
      } finally {
        state.hide();
      }
    })();
  };

  return (
    <Modal visible={state.visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={type === 'confirm' ? undefined : close}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: theme.bg }]}>
            <Ionicons name={theme.icon} size={36} color={theme.color} />
          </View>
          <Text style={styles.title}>{state.title}</Text>
          {state.message ? <Text style={styles.message}>{state.message}</Text> : null}
          <View style={styles.actions}>
            {type === 'confirm' ? (
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={close}>
                <Text style={styles.btnGhostText}>{state.cancelText}</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.btn, type === 'error' ? styles.btnDanger : styles.btnPrimary, type !== 'confirm' && styles.btnFull]}
              onPress={confirm}
            >
              <Text style={styles.btnPrimaryText}>{state.confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.secondary, textAlign: 'center' },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnFull: { flex: 1 },
  btnPrimary: { backgroundColor: Colors.primary },
  btnDanger: { backgroundColor: Colors.danger },
  btnGhost: { backgroundColor: Colors.backgroundElement, borderWidth: 1, borderColor: Colors.border },
  btnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  btnGhostText: { color: Colors.secondary, fontWeight: '700', fontSize: 15 },
});
