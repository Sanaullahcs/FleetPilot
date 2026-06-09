import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/ui/app-icon';
import { Colors } from '@/constants/theme';
import { fetchMobileAppInfo } from '@/lib/mobile-api';
import type { LegalDocumentId } from '@/lib/mobile-types';

export function LegalPolicyModal({
  visible,
  documentId,
  onClose,
}: {
  visible: boolean;
  documentId: LegalDocumentId | null;
  onClose: () => void;
}) {
  const info = useQuery({ queryKey: ['mobile-app-info'], queryFn: () => fetchMobileAppInfo(), enabled: visible });
  const content = documentId ? info.data?.documents[documentId] : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{content?.title ?? 'Policy'}</Text>
            {content ? <Text style={styles.subtitle}>Updated {content.updated_at}</Text> : null}
          </View>
          <Pressable style={styles.close} onPress={onClose}>
            <AppIcon name="close" size={18} color={Colors.secondary} variant="soft" />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {content?.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.heading}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.secondary },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  close: { marginLeft: 12 },
  scroll: { padding: 18, paddingBottom: 40, gap: 18 },
  section: { gap: 6 },
  heading: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});
