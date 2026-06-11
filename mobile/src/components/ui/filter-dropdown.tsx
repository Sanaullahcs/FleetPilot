import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@/components/ui/icons';
import { Colors, RoleAccents } from '@/constants/theme';

export type FilterDropdownOption<T extends string> = {
  id: T;
  label: string;
  hint?: string;
  count?: number;
};

export function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  accent = RoleAccents.driver,
}: {
  label: string;
  value: T;
  options: FilterDropdownOption<T>[];
  onChange: (id: T) => void;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Pressable
          style={[styles.trigger, open && { borderColor: accent }]}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${selected?.label ?? 'Select'}`}
        >
          <View style={styles.triggerBody}>
            <Text style={styles.triggerLabel} numberOfLines={1}>
              {selected?.label ?? 'Select'}
            </Text>
            {selected?.count != null ? (
              <View style={[styles.countBadge, { backgroundColor: `${accent}16` }]}>
                <Text style={[styles.countText, { color: accent }]}>{selected.count}</Text>
              </View>
            ) : null}
          </View>
          <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={styles.sheetList} bounces={false}>
              {options.map((option) => {
                const active = option.id === value;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.option, active && { backgroundColor: `${accent}10` }]}
                    onPress={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                  >
                    <View style={styles.optionBody}>
                      <Text style={[styles.optionLabel, active && { color: accent }]}>{option.label}</Text>
                      {option.hint ? <Text style={styles.optionHint}>{option.hint}</Text> : null}
                    </View>
                    <View style={styles.optionRight}>
                      {option.count != null ? (
                        <View style={[styles.optionCount, active && { backgroundColor: `${accent}18` }]}>
                          <Text style={[styles.optionCountText, active && { color: accent }]}>{option.count}</Text>
                        </View>
                      ) : null}
                      {active ? <Ionicons name="checkmark-circle" size={20} color={accent} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0, gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  triggerBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  triggerLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.label },
  countBadge: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 11, fontWeight: '800' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '62%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.label },
  sheetList: { paddingHorizontal: 10, paddingTop: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  optionBody: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: Colors.label },
  optionHint: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  optionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionCount: {
    minWidth: 26,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundElement,
  },
  optionCountText: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary },
});
