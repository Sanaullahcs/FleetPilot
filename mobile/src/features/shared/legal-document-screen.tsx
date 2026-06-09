import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader } from '@/components/shell/app-header';
import { Card } from '@/components/ui/primitives';
import { Colors } from '@/constants/theme';
import { fetchMobileAppInfo } from '@/lib/mobile-api';
import type { LegalDocumentId } from '@/lib/mobile-types';

const titles: Record<string, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  'account-deletion': 'Account Deletion',
};

export function LegalDocumentScreen() {
  const { document } = useLocalSearchParams<{ document: string }>();
  const router = useRouter();
  const docId = (document ?? 'privacy') as LegalDocumentId;

  const info = useQuery({ queryKey: ['mobile-app-info'], queryFn: () => fetchMobileAppInfo() });
  const content = info.data?.documents[docId];

  return (
    <View style={styles.root}>
      <AppHeader
        title={content?.title ?? titles[document ?? 'privacy'] ?? 'Policy'}
        subtitle={content ? `Updated ${content.updated_at}` : 'Loading…'}
        onBackPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {info.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : content ? (
          content.sections.map((section) => (
            <Card key={section.heading} style={styles.section}>
              <Text style={styles.heading}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </Card>
          ))
        ) : (
          <Card>
            <Text style={styles.body}>This document is unavailable. Please try again later or contact support.</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 40, gap: 12 },
  section: { gap: 8 },
  heading: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});
