import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/shell/app-header';
import { KeyboardFormScreen } from '@/components/ui/keyboard-form-screen';
import { Card, ListRow } from '@/components/ui/primitives';
import { Colors } from '@/constants/theme';
import { fetchMobileSupport } from '@/lib/mobile-api';
import { showSweetAlert } from '@/store/sweet-alert';

export function SupportScreen() {
  const router = useRouter();
  const support = useQuery({ queryKey: ['mobile-support'], queryFn: fetchMobileSupport });

  return (
    <View style={styles.root}>
      <AppHeader title="Help & support" subtitle="Contact your transportation team" onBackPress={() => router.back()} />
      <KeyboardFormScreen contentContainerStyle={styles.scroll}>
        {support.isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            {support.data?.channels.map((channel) => (
              <Card key={channel.id} style={styles.channelCard}>
                <Text style={styles.channelTitle}>{channel.title}</Text>
                <Text style={styles.channelDesc}>{channel.description}</Text>
                <Text style={styles.channelHours}>{channel.hours}</Text>
                <View style={styles.actions}>
                  {channel.email ? (
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => {
                        Linking.openURL(`mailto:${channel.email}`).then(() =>
                          showSweetAlert({ type: 'success', title: 'Opening email', message: `Compose to ${channel.email}` }),
                        );
                      }}
                    >
                      <Text style={styles.actionText}>Email</Text>
                    </Pressable>
                  ) : null}
                  {channel.phone ? (
                    <Pressable
                      style={[styles.actionBtn, styles.actionBtnAlt]}
                      onPress={() => {
                        Linking.openURL(`tel:${channel.phone!.replace(/\D/g, '')}`).then(() =>
                          showSweetAlert({ type: 'success', title: 'Calling', message: channel.phone! }),
                        );
                      }}
                    >
                      <Text style={[styles.actionText, styles.actionTextAlt]}>Call</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Card>
            ))}

            <Text style={styles.sectionLabel}>Complaint center</Text>
            <Card>
              <ListRow
                title="Register or track a complaint"
                subtitle="Formal route, safety, and service issues reviewed by admin"
                icon="document-text-outline"
                onPress={() => router.push('/complaints')}
              />
            </Card>

            <Text style={styles.sectionLabel}>Common questions</Text>
            <Card style={styles.faqCard}>
              {support.data?.faqs.map((faq) => (
                <View key={faq.question} style={styles.faqItem}>
                  <Text style={styles.faqQ}>{faq.question}</Text>
                  <Text style={styles.faqA}>{faq.answer}</Text>
                </View>
              ))}
            </Card>

            <Text style={styles.sectionLabel}>Legal & policies</Text>
            <Card>
              <ListRow
                title="Privacy Policy"
                subtitle="How your data is collected and used"
                icon="shield-checkmark-outline"
                onPress={() => router.push({ pathname: '/legal/[document]', params: { document: 'privacy' } })}
              />
              <ListRow
                title="Terms of Service"
                subtitle="Rules for using this app"
                icon="document-text-outline"
                onPress={() => router.push({ pathname: '/legal/[document]', params: { document: 'terms' } })}
              />
              <ListRow
                title="Account Deletion Policy"
                subtitle="What happens when you delete your account"
                icon="trash-outline"
                onPress={() => router.push({ pathname: '/legal/[document]', params: { document: 'account-deletion' } })}
              />
            </Card>
          </>
        )}
      </KeyboardFormScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 40, gap: 14 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.placeholder,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  channelCard: { gap: 8 },
  channelTitle: { fontSize: 16, fontWeight: '700', color: Colors.secondary },
  channelDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  channelHours: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionBtnAlt: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  actionText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  actionTextAlt: { color: Colors.primary },
  faqCard: { gap: 16 },
  faqItem: { gap: 6, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  faqQ: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  faqA: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
