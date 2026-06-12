import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@/components/ui/icons';
import { Colors, RoleAccents } from '@/constants/theme';
import { ui } from '@/constants/ui-styles';
import { fetchSignupAdmins, fetchSignupOrganizations, fetchSignupSchools, register } from '@/lib/auth-api';
import {
  buildRegisterPayload,
  EMPTY_SIGNUP_FORM,
  mapSignupApiErrors,
  RELATIONSHIP_OPTIONS,
  type SignupField,
  type SignupFormState,
  type SignupRole,
  validateSignupForm,
} from '@/lib/auth-signup';
import type { FieldErrors } from '@/lib/auth-validation';
import { ApiError } from '@/lib/api';
import { US_STATES } from '@/lib/us-states';
import { showSweetAlert } from '@/store/sweet-alert';
import { AuthFormAlert } from '@/components/auth/auth-form-alert';
import { AuthFormField, authInputStyle } from '@/components/auth/auth-form-field';
import { CaptchaField } from '@/components/auth/captcha-field';
import { TermsCheckbox } from '@/components/auth/terms-checkbox';
import type { LegalDocumentId } from '@/lib/mobile-types';
import { demoCredentialsForRole } from '@/features/auth/role-portals';

type PickerKind =
  | 'organization'
  | 'admin'
  | 'school'
  | 'relationship'
  | 'license_state'
  | 'address_state'
  | null;

export function SignupForm({
  onSuccess,
  role: roleProp,
  hideRoleSelector = false,
  onOpenLegal,
  captchaResetKey = 0,
}: {
  onSuccess: () => void;
  role?: SignupRole;
  hideRoleSelector?: boolean;
  onOpenLegal?: (document: LegalDocumentId) => void;
  captchaResetKey?: number | string;
}) {
  const [form, setForm] = useState<SignupFormState>({
    ...EMPTY_SIGNUP_FORM,
    role: roleProp ?? EMPTY_SIGNUP_FORM.role,
  });
  const [picker, setPicker] = useState<PickerKind>(null);
  const [orgSearch, setOrgSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SignupField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const patch = (updates: Partial<SignupFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(updates) as (keyof SignupFormState)[]) {
        delete next[key];
      }
      return next;
    });
    setFormError(null);
  };

  const orgs = useQuery({
    queryKey: ['signup-organizations', orgSearch],
    queryFn: () => fetchSignupOrganizations(orgSearch || undefined),
  });

  const admins = useQuery({
    queryKey: ['signup-admins', form.organizationId],
    queryFn: () => fetchSignupAdmins(form.organizationId),
    enabled: !!form.organizationId,
  });

  const schools = useQuery({
    queryKey: ['signup-schools', form.organizationId],
    queryFn: () => fetchSignupSchools(form.organizationId),
    enabled: !!form.organizationId && form.role === 'parent',
  });

  useEffect(() => {
    patch({ adminUserId: '', schoolId: '' });
  }, [form.organizationId]);

  useEffect(() => {
    if (!roleProp) return;
    const demo = demoCredentialsForRole(roleProp);
    setForm((prev) => ({
      ...prev,
      role: roleProp,
      email: demo.email,
      password: demo.password,
      passwordConfirm: demo.password,
      firstName: demo.firstName,
      lastName: demo.lastName,
      phone: demo.phone,
    }));
    setFieldErrors({});
    setFormError(null);
  }, [roleProp]);

  const accent = form.role === 'driver' ? RoleAccents.driver : RoleAccents.parent;

  const selectedOrg = orgs.data?.find((o) => o.id === form.organizationId);
  const selectedAdmin = admins.data?.find((a) => a.id === form.adminUserId);
  const selectedSchool = schools.data?.find((s) => s.id === form.schoolId);
  const selectedRelationship = RELATIONSHIP_OPTIONS.find((r) => r.value === form.relationship);

  const onSubmit = async () => {
    setFormError(null);

    const errors: FieldErrors<SignupField> = { ...validateSignupForm(form) };
    if (!acceptedTerms) {
      errors.terms = 'Accept the Terms & Conditions and Privacy Policy.';
    }
    if (!captchaValid) {
      errors.captcha = 'Enter the correct answer to continue.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await register(buildRegisterPayload(form));
      showSweetAlert({
        type: 'success',
        title: 'Registration submitted',
        message: res.message,
        onConfirm: onSuccess,
      });
    } catch (e) {
      if (e instanceof ApiError) {
        const { fieldErrors: apiFieldErrors, formError: apiFormError } = mapSignupApiErrors(e.errors, e.message);
        setFieldErrors(apiFieldErrors);
        setFormError(apiFormError);
      } else {
        setFormError('Unable to complete registration. Check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pickerItems = useMemo(() => {
    if (picker === 'organization') {
      return (orgs.data ?? []).map((o) => ({ id: o.id, title: o.name, subtitle: o.slug }));
    }
    if (picker === 'admin') {
      return (admins.data ?? []).map((a) => ({
        id: a.id,
        title: `${a.first_name} ${a.last_name}`,
        subtitle: a.role === 'admin' ? 'Administrator' : 'Dispatcher',
      }));
    }
    if (picker === 'school') {
      return (schools.data ?? []).map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: [s.city, s.district].filter(Boolean).join(' · ') || s.code || '',
      }));
    }
    if (picker === 'relationship') {
      return RELATIONSHIP_OPTIONS.map((r) => ({ id: r.value, title: r.label, subtitle: '' }));
    }
    if (picker === 'license_state' || picker === 'address_state') {
      return US_STATES.map((s) => ({ id: s.value, title: s.label, subtitle: s.value }));
    }
    return [];
  }, [picker, orgs.data, admins.data, schools.data]);

  const onPick = (id: string) => {
    if (picker === 'organization') patch({ organizationId: id });
    else if (picker === 'admin') patch({ adminUserId: id });
    else if (picker === 'school') patch({ schoolId: id });
    else if (picker === 'relationship') patch({ relationship: id });
    else if (picker === 'license_state') patch({ licenseState: id });
    else if (picker === 'address_state') patch({ state: id });
    setPicker(null);
  };

  const pickerTitle =
    picker === 'organization'
      ? 'Transportation provider'
      : picker === 'admin'
        ? 'Administrator'
        : picker === 'school'
          ? 'School'
          : picker === 'relationship'
            ? 'Relationship to student'
            : 'Select state';

  return (
    <View style={styles.wrap}>
      {!hideRoleSelector ? (
        <>
          <Text style={styles.sectionLabel}>I am a</Text>
          <View style={styles.roleRow}>
            {(['parent', 'driver'] as SignupRole[]).map((r) => {
              const active = form.role === r;
              const color = r === 'driver' ? RoleAccents.driver : RoleAccents.parent;
              const demo = demoCredentialsForRole(r);
              return (
                <Pressable
                  key={r}
                  style={[styles.roleChip, active && { borderColor: color, backgroundColor: `${color}12` }]}
                  onPress={() =>
                    patch({
                      role: r,
                      email: demo.email,
                      password: demo.password,
                      passwordConfirm: demo.password,
                      firstName: demo.firstName,
                      lastName: demo.lastName,
                      phone: demo.phone,
                    })
                  }
                >
                  <Ionicons
                    name={r === 'driver' ? 'bus-outline' : 'people-outline'}
                    size={20}
                    color={active ? color : Colors.placeholder}
                  />
                  <Text style={[styles.roleChipText, active && { color }]}>{r === 'driver' ? 'Driver' : 'Parent'}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Provider & school</Text>
      <SelectField
        label="Transportation provider"
        value={selectedOrg?.name}
        placeholder="Select your district provider"
        onPress={() => setPicker('organization')}
        accent={accent}
        error={fieldErrors.organizationId}
      />
      <SelectField
        label="Reviewing administrator"
        value={selectedAdmin ? `${selectedAdmin.first_name} ${selectedAdmin.last_name}` : undefined}
        placeholder={form.organizationId ? 'Select administrator' : 'Choose provider first'}
        onPress={() => form.organizationId && setPicker('admin')}
        disabled={!form.organizationId}
        accent={accent}
        error={fieldErrors.adminUserId}
      />
      {form.role === 'parent' ? (
        <SelectField
          label="School"
          value={selectedSchool?.name}
          placeholder={form.organizationId ? 'Select school' : 'Choose provider first'}
          onPress={() => form.organizationId && setPicker('school')}
          disabled={!form.organizationId}
          accent={accent}
          error={fieldErrors.schoolId}
        />
      ) : null}

      <Text style={styles.sectionLabel}>Your account</Text>
      <View style={styles.row2}>
        <Field label="First name" value={form.firstName} onChange={(v) => patch({ firstName: v })} half error={fieldErrors.firstName} />
        <Field label="Last name" value={form.lastName} onChange={(v) => patch({ lastName: v })} half error={fieldErrors.lastName} />
      </View>
      <IconField
        label="Email"
        icon="mail-outline"
        value={form.email}
        onChange={(v) => patch({ email: v })}
        keyboard="email-address"
        autoCapitalize="none"
        placeholder="Enter your email"
        error={fieldErrors.email}
      />
      <Field label="Phone" value={form.phone} onChange={(v) => patch({ phone: v })} keyboard="phone-pad" error={fieldErrors.phone} />

      <View style={styles.row2}>
        <Field label="Password" value={form.password} onChange={(v) => patch({ password: v })} secure={!showPassword} half error={fieldErrors.password} />
        <Field
          label="Confirm password"
          value={form.passwordConfirm}
          onChange={(v) => patch({ passwordConfirm: v })}
          secure={!showPassword}
          half
          error={fieldErrors.passwordConfirm}
        />
      </View>
      <Pressable style={styles.showPass} onPress={() => setShowPassword((v) => !v)}>
        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.textMuted} />
        <Text style={styles.showPassText}>{showPassword ? 'Hide passwords' : 'Show passwords'}</Text>
      </Pressable>

      {form.role === 'parent' ? (
        <>
          <Text style={styles.sectionLabel}>Family</Text>
          <SelectField
            label="Relationship to student"
            value={selectedRelationship?.label}
            placeholder="Select relationship"
            onPress={() => setPicker('relationship')}
            accent={accent}
          />
          <Field label="Child's grade" value={form.childGrade} onChange={(v) => patch({ childGrade: v })} placeholder="K, 1, 2…" />
          <View style={styles.row2}>
            <Field label="Child's first name" value={form.childFirstName} onChange={(v) => patch({ childFirstName: v })} half />
            <Field label="Child's last name" value={form.childLastName} onChange={(v) => patch({ childLastName: v })} half />
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>{form.role === 'driver' ? 'Home address' : 'Home address'}</Text>
      <Field label="Street address" value={form.address} onChange={(v) => patch({ address: v })} error={fieldErrors.address} />
      <Field label="City" value={form.city} onChange={(v) => patch({ city: v })} error={fieldErrors.city} />
      <View style={styles.row2}>
        <SelectField
          label="State"
          value={form.state ? US_STATES.find((s) => s.value === form.state)?.label ?? form.state : undefined}
          placeholder="Select state"
          onPress={() => setPicker('address_state')}
          accent={accent}
          half
          error={fieldErrors.state}
        />
        <Field label="ZIP code" value={form.zip} onChange={(v) => patch({ zip: v })} keyboard="number-pad" half error={fieldErrors.zip} />
      </View>

      {form.role === 'driver' ? (
        <>
          <Text style={styles.sectionLabel}>Driver profile</Text>
          <View style={styles.row2}>
            <Field label="Employee ID" value={form.employeeId} onChange={(v) => patch({ employeeId: v })} half />
            <Field
              label="Date of birth"
              value={form.dateOfBirth}
              onChange={(v) => patch({ dateOfBirth: v })}
              placeholder="YYYY-MM-DD"
              half
            />
          </View>
          <View style={styles.row2}>
            <Field label="Driver license #" value={form.licenseNumber} onChange={(v) => patch({ licenseNumber: v })} half />
            <SelectField
              label="License state"
              value={form.licenseState ? US_STATES.find((s) => s.value === form.licenseState)?.label : undefined}
              placeholder="State"
              onPress={() => setPicker('license_state')}
              accent={accent}
              half
            />
          </View>
          <Field
            label="License expiry"
            value={form.licenseExpiry}
            onChange={(v) => patch({ licenseExpiry: v })}
            placeholder="YYYY-MM-DD"
          />
          <View style={styles.row2}>
            <Field
              label="Emergency contact"
              value={form.emergencyContactName}
              onChange={(v) => patch({ emergencyContactName: v })}
              half
            />
            <Field
              label="Emergency phone"
              value={form.emergencyContactPhone}
              onChange={(v) => patch({ emergencyContactPhone: v })}
              keyboard="phone-pad"
              half
            />
          </View>
        </>
      ) : null}

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.warning} />
        <Text style={styles.noticeText}>
          Your provider will review this registration before activating your account.
        </Text>
      </View>

      <CaptchaField
        resetKey={`${captchaResetKey}-${form.role}`}
        onValidChange={(valid) => {
          setCaptchaValid(valid);
          if (valid) {
            setFieldErrors((prev) => {
              if (!prev.captcha) return prev;
              const next = { ...prev };
              delete next.captcha;
              return next;
            });
          }
        }}
        error={fieldErrors.captcha}
      />

      <TermsCheckbox
        checked={acceptedTerms}
        onToggle={() => {
          setAcceptedTerms((v) => !v);
          setFieldErrors((prev) => {
            if (!prev.terms) return prev;
            const next = { ...prev };
            delete next.terms;
            return next;
          });
        }}
        accent={accent}
        onOpenPrivacy={() => onOpenLegal?.('privacy')}
        onOpenTerms={() => onOpenLegal?.('terms')}
        error={fieldErrors.terms}
      />

      {formError ? <AuthFormAlert message={formError} /> : null}

      <Pressable
        style={[styles.submitBtn, { backgroundColor: accent }, submitting && styles.submitDisabled]}
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="paper-plane-outline" size={18} color={Colors.white} />
            <Text style={styles.submitText}>Submit registration</Text>
          </>
        )}
      </Pressable>

      <Modal visible={picker !== null} animationType="slide" transparent onRequestClose={() => setPicker(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerTitle}</Text>
              <Pressable onPress={() => setPicker(null)}>
                <Ionicons name="close" size={24} color={Colors.secondary} />
              </Pressable>
            </View>
            {picker === 'organization' ? (
              <TextInput
                value={orgSearch}
                onChangeText={setOrgSearch}
                placeholder="Search providers…"
                placeholderTextColor={Colors.placeholder}
                style={styles.searchInput}
                autoCapitalize="none"
              />
            ) : null}
            {(picker === 'admin' && admins.isLoading) ||
            (picker === 'school' && schools.isLoading) ||
            (picker === 'organization' && orgs.isFetching) ? (
              <ActivityIndicator color={Colors.primary} style={{ margin: 24 }} />
            ) : (
              <FlatList
                data={pickerItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 24 }}
                ListEmptyComponent={
                  <Text style={styles.emptyPicker}>No options available.</Text>
                }
                renderItem={({ item }) => (
                  <Pressable style={styles.pickerRow} onPress={() => onPick(item.id)}>
                    <Text style={styles.pickerTitle}>{item.title}</Text>
                    {item.subtitle ? <Text style={styles.pickerSub}>{item.subtitle}</Text> : null}
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled,
  accent,
  half,
  error,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  accent: string;
  half?: boolean;
  error?: string;
}) {
  const hasError = Boolean(error);

  return (
    <AuthFormField label={label} error={error} style={half ? styles.half : undefined}>
      <Pressable
        style={[
          styles.select,
          disabled && styles.selectDisabled,
          value && !hasError && { borderColor: `${accent}55` },
          authInputStyle(hasError),
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={hasError ? Colors.danger : Colors.placeholder} />
      </Pressable>
    </AuthFormField>
  );
}

function IconField({
  label,
  icon,
  value,
  onChange,
  half,
  secure,
  keyboard,
  autoCapitalize,
  placeholder,
  error,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChange: (v: string) => void;
  half?: boolean;
  secure?: boolean;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'characters' | 'sentences' | 'words';
  placeholder?: string;
  error?: string;
}) {
  return (
    <AuthFormField label={label} error={error} style={half ? styles.half : undefined}>
      <View style={[styles.inputRow, authInputStyle(Boolean(error))]}>
        <Ionicons name={icon} size={18} color={error ? Colors.danger : Colors.placeholder} />
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          keyboardType={keyboard}
          autoCapitalize={autoCapitalize ?? 'words'}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholder}
          style={styles.iconInput}
        />
      </View>
    </AuthFormField>
  );
}

function Field({
  label,
  value,
  onChange,
  half,
  secure,
  keyboard,
  autoCapitalize,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  half?: boolean;
  secure?: boolean;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'characters' | 'sentences' | 'words';
  placeholder?: string;
  error?: string;
}) {
  return (
    <AuthFormField label={label} error={error} style={half ? styles.half : undefined}>
      <TextInput
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize={autoCapitalize ?? 'words'}
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholder}
        style={[ui.input, authInputStyle(Boolean(error))]}
      />
    </AuthFormField>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  sectionLabel: {
    ...ui.sectionEyebrow,
    marginTop: 10,
    marginBottom: 10,
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  roleChipText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  field: { marginBottom: 12 },
  half: { flex: 1 },
  row2: { flexDirection: 'row', gap: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: Colors.surface,
  },
  iconInput: { flex: 1, fontSize: 15, color: Colors.secondary, padding: 0 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Colors.surface,
  },
  selectDisabled: { opacity: 0.5 },
  selectText: { flex: 1, fontSize: 15, color: Colors.secondary, fontWeight: '500' },
  selectPlaceholder: { color: Colors.placeholder, fontWeight: '400' },
  showPass: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: -4 },
  showPassText: { fontSize: 13, color: Colors.textMuted },
  notice: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#92400E' },
  termsRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: { flex: 1, fontSize: 13, lineHeight: 19, color: Colors.textMuted },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.secondary },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.secondary,
    backgroundColor: Colors.backgroundElement,
  },
  pickerRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: { fontSize: 16, fontWeight: '600', color: Colors.secondary },
  pickerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  emptyPicker: { textAlign: 'center', color: Colors.textMuted, padding: 24 },
});
