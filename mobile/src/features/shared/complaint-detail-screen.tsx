import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { AppHeader } from '@/components/shell/app-header';
import { KeyboardFormScreen } from '@/components/ui/keyboard-form-screen';
import { Card, EmptyState, StatusBadge } from '@/components/ui/primitives';
import { Colors } from '@/constants/theme';
import { addComplaintComment, fetchComplaint } from '@/lib/complaints-api';
import { getQueryErrorMessage } from '@/lib/query-utils';
import { showSweetAlert } from '@/store/sweet-alert';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const detail = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => fetchComplaint(id!),
    enabled: !!id,
    refetchInterval: 10_000,
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => addComplaintComment(id!, body),
    onSuccess: () => {
      setReply('');
      void queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      void queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
      showSweetAlert({ type: 'success', title: 'Reply sent', message: 'Transportation admin has been notified.' });
    },
    onError: (error) => {
      showSweetAlert({ type: 'error', title: 'Reply failed', message: getQueryErrorMessage(error) });
    },
  });

  const item = detail.data;
  const canReply = item && !['closed', 'rejected', 'resolved'].includes(item.status);

  return (
    <View style={styles.root}>
      <AppHeader
        title={item?.reference_number ?? 'Complaint'}
        subtitle={item?.status_label ?? 'Loading…'}
        onBackPress={() => router.back()}
      />
      {detail.isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : detail.isError || !item ? (
        <EmptyState
          title="Complaint unavailable"
          message={getQueryErrorMessage(detail.error)}
          icon="cloud-offline-outline"
          accent={Colors.danger}
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      ) : (
        <KeyboardFormScreen contentContainerStyle={styles.scroll}>
          <Card style={styles.hero}>
            <Text style={styles.subject}>{item.subject}</Text>
            <View style={styles.badges}>
              <StatusBadge label={item.status_label} tone="info" />
              <StatusBadge label={item.priority_label} tone={item.priority === 'urgent' ? 'danger' : 'info'} />
            </View>
            <Text style={styles.meta}>{item.category_label}</Text>
            {item.assignee ? <Text style={styles.meta}>Assigned to {item.assignee.name}</Text> : null}
          </Card>

          <Card>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.body}>{item.description}</Text>
            {item.incident_date ? <Text style={styles.meta}>Incident: {item.incident_date}</Text> : null}
            {item.location_note ? <Text style={styles.meta}>Location: {item.location_note}</Text> : null}
            {item.student ? <Text style={styles.meta}>Student: {item.student.name}</Text> : null}
            {item.route ? <Text style={styles.meta}>Route: {item.route.name}</Text> : null}
          </Card>

          {item.resolution_summary ? (
            <Card style={styles.resolution}>
              <Text style={styles.sectionLabel}>Resolution</Text>
              <Text style={styles.body}>{item.resolution_summary}</Text>
            </Card>
          ) : null}

          <Text style={styles.sectionLabel}>Activity</Text>
          {(item.updates ?? []).map((update) => (
            <Card key={update.id} style={styles.update}>
              <View style={styles.updateTop}>
                <Text style={styles.updateAuthor}>{update.author.name}</Text>
                <Text style={styles.updateTime}>{formatWhen(update.created_at)}</Text>
              </View>
              <Text style={styles.body}>{update.body}</Text>
            </Card>
          ))}

          {canReply ? (
            <Card style={styles.replyBox}>
              <Text style={styles.sectionLabel}>Add information</Text>
              <TextInput
                value={reply}
                onChangeText={setReply}
                style={[styles.input, styles.textArea]}
                placeholder="Reply when admin requests more details…"
                multiline
              />
              <Pressable
                style={[styles.replyBtn, (!reply.trim() || replyMutation.isPending) && styles.replyBtnDisabled]}
                disabled={!reply.trim() || replyMutation.isPending}
                onPress={() => replyMutation.mutate(reply.trim())}
              >
                <Text style={styles.replyBtnText}>Send reply</Text>
              </Pressable>
            </Card>
          ) : null}
        </KeyboardFormScreen>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 40, gap: 12 },
  hero: { gap: 8 },
  subject: { fontSize: 18, fontWeight: '800', color: Colors.secondary, lineHeight: 24 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  meta: { fontSize: 12, color: Colors.textMuted },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.placeholder, textTransform: 'uppercase', marginBottom: 6 },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  resolution: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  update: { gap: 6 },
  updateTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  updateAuthor: { fontSize: 13, fontWeight: '700', color: Colors.secondary },
  updateTime: { fontSize: 11, color: Colors.placeholder },
  replyBox: { gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.secondary,
    backgroundColor: Colors.surface,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  replyBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replyBtnDisabled: { opacity: 0.5 },
  replyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
