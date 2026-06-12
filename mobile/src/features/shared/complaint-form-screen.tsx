import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AppHeader } from '@/components/shell/app-header';
import { KeyboardFormScreen } from '@/components/ui/keyboard-form-screen';
import { Card } from '@/components/ui/primitives';
import { Colors } from '@/constants/theme';
import { createComplaint, fetchComplaintFormOptions } from '@/lib/complaints-api';
import { showSweetAlert } from '@/store/sweet-alert';
import { getQueryErrorMessage } from '@/lib/query-utils';

export function ComplaintFormScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const options = useQuery({ queryKey: ['complaint-form-options'], queryFn: fetchComplaintFormOptions });

  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [preferredContact, setPreferredContact] = useState('app');
  const [contactPhone, setContactPhone] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [studentId, setStudentId] = useState('');
  const [routeId, setRouteId] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      createComplaint({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        preferred_contact: preferredContact,
        contact_phone: contactPhone.trim() || undefined,
        incident_date: incidentDate || undefined,
        location_note: locationNote.trim() || undefined,
        student_id: studentId || undefined,
        route_id: routeId || undefined,
        school_id: options.data?.school?.id,
      }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
      showSweetAlert({
        type: 'success',
        title: 'Complaint submitted',
        message: `Reference ${data.reference_number}. Transportation admin will review it shortly.`,
      });
      router.replace(`/complaint/${data.id}`);
    },
    onError: (error) => {
      showSweetAlert({ type: 'error', title: 'Submission failed', message: getQueryErrorMessage(error) });
    },
  });

  const phone = options.data?.organization.phone;
  const canSubmit = category && subject.trim().length >= 5 && description.trim().length >= 20;

  return (
    <View style={styles.root}>
      <AppHeader title="Register a complaint" subtitle="Tracked by transportation administrators" onBackPress={() => router.back()} />
      <KeyboardFormScreen contentContainerStyle={styles.scroll}>
        {options.isLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <>
            <Card style={styles.notice}>
              <Text style={styles.noticeTitle}>Urgent safety issue?</Text>
              <Text style={styles.noticeText}>Call dispatch immediately — do not wait for a complaint review.</Text>
              {phone ? (
                <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${phone.replace(/\D/g, '')}`)}>
                  <Text style={styles.callBtnText}>Call {phone}</Text>
                </Pressable>
              ) : null}
            </Card>

            <Field label="Category">
              <PickerRow
                value={category}
                options={options.data?.categories ?? []}
                placeholder="Select category"
                onChange={setCategory}
              />
            </Field>

            <Field label="Priority">
              <PickerRow value={priority} options={options.data?.priorities ?? []} onChange={setPriority} />
            </Field>

            <Field label="Subject">
              <TextInput value={subject} onChangeText={setSubject} style={styles.input} placeholder="Brief summary" maxLength={200} />
            </Field>

            <Field label="Description">
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.textArea]}
                placeholder="What happened? Include dates, routes, and people involved."
                multiline
                maxLength={10000}
              />
              <Text style={styles.hint}>{description.trim().length} characters · minimum 20</Text>
            </Field>

            <Field label="Preferred contact">
              <PickerRow value={preferredContact} options={options.data?.contact_methods ?? []} onChange={setPreferredContact} />
            </Field>

            <Field label="Phone for callback (optional)">
              <TextInput value={contactPhone} onChangeText={setContactPhone} style={styles.input} placeholder="Your phone number" keyboardType="phone-pad" />
            </Field>

            <Field label="Incident date (optional)">
              <TextInput value={incidentDate} onChangeText={setIncidentDate} style={styles.input} placeholder="YYYY-MM-DD" />
            </Field>

            <Field label="Location / stop (optional)">
              <TextInput value={locationNote} onChangeText={setLocationNote} style={styles.input} placeholder="Stop name or address" />
            </Field>

            {(options.data?.students.length ?? 0) > 0 ? (
              <Field label="Related student">
                <PickerRow
                  value={studentId}
                  options={[{ value: '', label: 'Not specific to one student' }, ...(options.data?.students.map((s) => ({ value: s.id, label: s.name })) ?? [])]}
                  onChange={setStudentId}
                />
              </Field>
            ) : null}

            {(options.data?.routes.length ?? 0) > 0 ? (
              <Field label="Related route">
                <PickerRow
                  value={routeId}
                  options={[{ value: '', label: 'Select route' }, ...(options.data?.routes.map((r) => ({ value: r.id, label: r.name })) ?? [])]}
                  onChange={setRouteId}
                />
              </Field>
            ) : null}

            <Pressable
              style={[styles.submit, (!canSubmit || submit.isPending) && styles.submitDisabled]}
              disabled={!canSubmit || submit.isPending}
              onPress={() => submit.mutate()}
            >
              {submit.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitText}>Register complaint</Text>
              )}
            </Pressable>
          </>
        )}
      </KeyboardFormScreen>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function PickerRow({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.pickerWrap}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <Pressable
            key={`${option.value}-${option.label}`}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
      {!value && placeholder ? <Text style={styles.placeholder}>{placeholder}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundElement },
  scroll: { padding: 18, paddingBottom: 40, gap: 14 },
  notice: { gap: 8, backgroundColor: Colors.orangeLight, borderColor: Colors.border },
  noticeTitle: { fontSize: 14, fontWeight: '800', color: Colors.secondary },
  noticeText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  callBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  callBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.secondary },
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
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  hint: { fontSize: 11, color: Colors.placeholder },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  placeholder: { fontSize: 12, color: Colors.placeholder },
  submit: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
});
