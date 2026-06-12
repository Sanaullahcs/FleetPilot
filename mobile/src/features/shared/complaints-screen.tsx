import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@/components/ui/icons';
import { AppHeader } from '@/components/shell/app-header';
import { Card, EmptyState, StatusBadge } from '@/components/ui/primitives';
import { Colors } from '@/constants/theme';
import { fetchMyComplaints } from '@/lib/complaints-api';
import type { ComplaintRecord } from '@/lib/complaint-types';
import { getQueryErrorMessage } from '@/lib/query-utils';

function statusTone(status: string) {
  if (status === 'resolved' || status === 'closed') return 'success' as const;
  if (status === 'waiting_on_submitter') return 'warning' as const;
  if (status === 'rejected') return 'danger' as const;
  return 'info' as const;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function ComplaintsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const complaints = useQuery({
    queryKey: ['my-complaints'],
    queryFn: () => fetchMyComplaints(),
    refetchInterval: 12_000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await complaints.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const goRegister = () => router.push('/complaint/new');

  return (
    <View style={styles.root}>
      <AppHeader
        title="Complaint center"
        subtitle="Track issues with transportation admin"
        onBackPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Pressable style={styles.registerBtn} onPress={goRegister} accessibilityRole="button">
          <View style={styles.registerIconWrap}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </View>
          <View style={styles.registerTextWrap}>
            <Text style={styles.registerTitle}>Register complaint</Text>
            <Text style={styles.registerHint}>Route, safety, driver, or service issues</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.75)" />
        </Pressable>

        {complaints.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : complaints.isError ? (
          <EmptyState
            title="Couldn't load complaints"
            message={getQueryErrorMessage(complaints.error)}
            icon="cloud-offline-outline"
            accent={Colors.danger}
            actionLabel="Try again"
            onAction={() => void complaints.refetch()}
          />
        ) : complaints.data?.items.length ? (
          <>
            <Text style={styles.sectionLabel}>Your complaints</Text>
            {complaints.data.items.map((item) => (
              <ComplaintCard key={item.id} item={item} onPress={() => router.push(`/complaint/${item.id}`)} />
            ))}
          </>
        ) : (
          <EmptyState
            title="No complaints yet"
            message="When you register a complaint, it will appear here with status updates from your transportation office."
            icon="document-text-outline"
            actionLabel="Register a complaint"
            onAction={goRegister}
          />
        )}
      </ScrollView>
    </View>
  );
}

function ComplaintCard({ item, onPress }: { item: ComplaintRecord; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.ref}>{item.reference_number}</Text>
          <StatusBadge label={item.priority_label} tone={item.priority === 'urgent' ? 'danger' : 'info'} />
        </View>
        <Text style={styles.subject}>{item.subject}</Text>
        <View style={styles.metaRow}>
          <StatusBadge label={item.status_label} tone={statusTone(item.status)} />
          <Text style={styles.category}>{item.category_label}</Text>
        </View>
        <Text style={styles.time}>Updated {formatWhen(item.last_activity_at)}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingTop: 12, paddingBottom: 40, gap: 12 },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  registerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerTextWrap: { flex: 1, gap: 2 },
  registerTitle: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  registerHint: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 17 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
    marginBottom: 2,
  },
  card: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  subject: { fontSize: 16, fontWeight: '700', color: Colors.secondary, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  category: { fontSize: 12, color: Colors.textMuted },
  time: { fontSize: 11, color: Colors.placeholder },
});
