import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/icons';
import { Colors, RoleAccents } from '@/constants/theme';
import {
  getAvailableExternalApps,
  openExternalNavigation,
  type MapStop,
  type NavigationAppOption,
} from '@/lib/maps-navigation';
import { showSweetAlert } from '@/store/sweet-alert';

type NavigationPickerSheetProps = {
  visible: boolean;
  stop: MapStop | null;
  onClose: () => void;
  onInAppNavigate: (stop: MapStop) => void;
};

export function NavigationPickerSheet({ visible, stop, onClose, onInAppNavigate }: NavigationPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [externalApps, setExternalApps] = useState<NavigationAppOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !stop) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    getAvailableExternalApps(stop)
      .then((apps) => {
        if (!cancelled) {
          setExternalApps(apps);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible, stop?.id, stop?.latitude, stop?.longitude]);

  const handleExternal = async (appId: NavigationAppOption['id']) => {
    if (!stop) {
      return;
    }
    const opened = await openExternalNavigation(appId, stop);
    if (!opened) {
      showSweetAlert({
        type: 'warning',
        title: 'Could not open app',
        message: 'Try FleetPilot navigation or install a maps app.',
      });
      return;
    }
    onClose();
  };

  const handleInApp = () => {
    if (!stop) {
      return;
    }
    onClose();
    onInAppNavigate(stop);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Navigate to stop</Text>
        {stop ? (
          <>
            <Text style={styles.stopName}>{stop.name}</Text>
            {stop.address ? <Text style={styles.stopAddress}>{stop.address}</Text> : null}
          </>
        ) : null}

        <Pressable style={styles.primaryOption} onPress={handleInApp}>
          <View style={styles.optionIconPrimary}>
            <Ionicons name="map" size={22} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>FleetPilot map</Text>
            <Text style={styles.optionSub}>Navigate inside the app</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.placeholder} />
        </Pressable>

        <Text style={styles.sectionLabel}>Other apps</Text>
        {loading ? (
          <ActivityIndicator color={RoleAccents.driver} style={{ marginVertical: 16 }} />
        ) : externalApps.length > 0 ? (
          externalApps.map((app) => (
            <Pressable key={app.id} style={styles.option} onPress={() => handleExternal(app.id)}>
              <View style={styles.optionIcon}>
                <Ionicons
                  name={app.icon === 'car' ? 'car' : app.icon === 'map' ? 'map-outline' : 'navigate-outline'}
                  size={20}
                  color={RoleAccents.driver}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{app.name}</Text>
                <Text style={styles.optionSub}>{app.subtitle}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.placeholder} />
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyHint}>No other navigation apps detected on this device.</Text>
        )}

        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.borderStrong,
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.secondary },
  stopName: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  stopAddress: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  primaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${RoleAccents.driver}12`,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${RoleAccents.driver}44`,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionIconPrimary: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: RoleAccents.driver,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: `${RoleAccents.driver}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  optionSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
});
