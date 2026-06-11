import { useCallback, useEffect, useRef, useState } from 'react';
import { Redirect, useRootNavigationState, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ui } from '@/constants/ui-styles';
import { isMobileRole, MOBILE_ROLE_DENIED_MESSAGE, getMobileRole, type MobileRole } from '@/constants/app';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/icons';
import { login } from '@/lib/auth-api';
import { ApiError } from '@/lib/api';
import {
  mapLoginApiErrors,
  validateSignInForm,
  type FieldErrors,
  type SignInField,
} from '@/lib/auth-validation';
import { useAuthStore } from '@/store/auth';
import { API_URL } from '@/lib/config';
import { FleetPilotLogoMark } from '@/components/brand/logo-mark';
import { AuthMeshBackground } from '@/components/auth/auth-mesh-background';
import { AuthFormAlert } from '@/components/auth/auth-form-alert';
import { AuthFormField, authInputStyle } from '@/components/auth/auth-form-field';
import { CaptchaField } from '@/components/auth/captcha-field';
import { LegalPolicyModal } from '@/components/legal/legal-policy-modal';
import { SignupForm } from '@/features/auth/signup-form';
import { RoleToggle } from '@/features/auth/role-toggle';
import { ROLE_MISMATCH_MESSAGES, ROLE_PORTALS } from '@/features/auth/role-portals';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
import type { LegalDocumentId } from '@/lib/mobile-types';

type AuthMode = 'signin' | 'signup';

function useAuthLayout() {
  const { width, height } = useWindowDimensions();
  const wide = width >= 720;
  const compact = height < 780;
  const tight = height < 720;
  return { width, height, wide, compact, tight };
}

function mobileHomeHref(role: MobileRole): '/home' | '/today' {
  return role === 'parent' ? '/home' : '/today';
}

export function AuthScreen() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const authLoading = useAuthStore((s) => s.loading);
  const token = useAuthStore((s) => s.token);
  const storedUser = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const storedRole = getMobileRole(storedUser);
  const { wide, compact, tight } = useAuthLayout();
  const scrollRef = useRef<ScrollView>(null);
  const keyboardInset = useKeyboardInset();
  const keyboardVisible = keyboardInset > 0;

  useEffect(() => {
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const sub = Keyboard.addListener(hideEvent, () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => sub.remove();
  }, []);

  const [role, setRole] = useState<MobileRole>('parent');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SignInField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [errorRoleHint, setErrorRoleHint] = useState<MobileRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocumentId | null>(null);

  const scrollFocusedFieldIntoView = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const roleConfig = ROLE_PORTALS[role];
  const captchaResetKey = `${mode}-${role}`;

  const clearAuthErrors = () => {
    setFieldErrors({});
    setFormError(null);
    setErrorRoleHint(null);
  };

  const clearFieldError = (field: SignInField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError(null);
  };

  const handleCaptchaValid = useCallback((valid: boolean) => {
    setCaptchaValid(valid);
    if (valid) {
      setFieldErrors((prev) => {
        if (!prev.captcha) return prev;
        const next = { ...prev };
        delete next.captcha;
        return next;
      });
    }
  }, []);

  const switchRole = (next: MobileRole) => {
    setRole(next);
    clearAuthErrors();
    setCaptchaValid(false);
  };

  const onSubmit = async () => {
    clearAuthErrors();

    const clientErrors = validateSignInForm(email, password, captchaValid);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (!isMobileRole(res.user.role)) {
        setFormError(MOBILE_ROLE_DENIED_MESSAGE);
        return;
      }
      if (res.user.role !== role) {
        setFormError(ROLE_MISMATCH_MESSAGES[role]);
        setErrorRoleHint(res.user.role);
        return;
      }
      await setSession(res.access_token, res.user);
      router.replace(mobileHomeHref(res.user.role));
    } catch (e) {
      if (e instanceof ApiError) {
        const { fieldErrors: apiFieldErrors, formError: apiFormError } = mapLoginApiErrors(e.errors, e.message);
        setFieldErrors(apiFieldErrors);
        setFormError(apiFormError);
      } else {
        setFormError(`Unable to connect to ${API_URL}. Check Wi‑Fi and that the backend is running.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail(roleConfig.demoEmail);
    setPassword('password');
    setMode('signin');
    clearAuthErrors();
  };

  const title = mode === 'signin' ? roleConfig.signInTitle : roleConfig.signUpTitle;
  const subtitle = mode === 'signin' ? roleConfig.signInSubtitle : roleConfig.signUpSubtitle;
  const logoSize = tight ? 32 : compact ? 36 : 40;
  const showPerks = mode === 'signin' && !tight && !keyboardVisible;

  if (!authLoading && token && storedUser && storedRole && navigationState?.key) {
    return <Redirect href={mobileHomeHref(storedRole)} />;
  }

  const card = (
    <View style={[styles.card, wide && styles.cardWide, { borderTopColor: roleConfig.accent }]}>
      <View style={[styles.cardHeader, compact && styles.cardHeaderCompact]}>
        <View style={[styles.logoBadge, compact && styles.logoBadgeCompact, { backgroundColor: `${roleConfig.accent}12` }]}>
          <FleetPilotLogoMark size={logoSize} />
        </View>
        <Text style={[styles.brandName, compact && styles.brandNameCompact]}>FleetPilot</Text>
        <Text style={[styles.brandTag, { color: roleConfig.accent }]}>{roleConfig.appName}</Text>
      </View>

      <View style={[styles.cardInner, compact && styles.cardInnerCompact]}>
        <Text style={styles.sectionHint}>I use this app as a</Text>
        <RoleToggle role={role} onChange={switchRole} />

        <View style={[styles.headline, compact && styles.headlineCompact]}>
          <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]} numberOfLines={tight ? 1 : 2}>
            {subtitle}
          </Text>
        </View>

        {showPerks ? (
          <View style={styles.perkRow}>
            {roleConfig.highlights.map((item) => (
              <View key={item.text} style={[styles.perk, { borderColor: `${roleConfig.accent}33` }]}>
                <Ionicons name={item.icon} size={14} color={roleConfig.accent} />
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.segment, compact && styles.segmentCompact]}>
          <Pressable
            style={[styles.segmentBtn, mode === 'signin' && styles.segmentBtnActive]}
            onPress={() => { setMode('signin'); clearAuthErrors(); setCaptchaValid(false); }}
          >
            <Text style={[styles.segmentText, mode === 'signin' && styles.segmentTextActive]}>Sign in</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}
            onPress={() => { setMode('signup'); clearAuthErrors(); setCaptchaValid(false); }}
          >
            <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>Create account</Text>
          </Pressable>
        </View>

        <View style={[styles.cardBody, compact && styles.cardBodyCompact]}>
          {mode === 'signin' ? (
            <>
              <AuthFormField label="Email" error={fieldErrors.email} compact={compact}>
                <View
                  style={[
                    styles.inputRow,
                    compact && styles.inputRowCompact,
                    authInputStyle(Boolean(fieldErrors.email)),
                  ]}
                >
                  <Ionicons name="mail-outline" size={16} color={fieldErrors.email ? Colors.danger : Colors.placeholder} />
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      clearFieldError('email');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    placeholder="Enter your email"
                    placeholderTextColor={Colors.placeholder}
                    style={styles.input}
                  />
                </View>
              </AuthFormField>

              <AuthFormField label="Password" error={fieldErrors.password} compact={compact}>
                <View
                  style={[
                    styles.inputRow,
                    compact && styles.inputRowCompact,
                    authInputStyle(Boolean(fieldErrors.password)),
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={16} color={fieldErrors.password ? Colors.danger : Colors.placeholder} />
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearFieldError('password');
                    }}
                    onFocus={scrollFocusedFieldIntoView}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    placeholder="Enter password"
                    placeholderTextColor={Colors.placeholder}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.placeholder} />
                  </Pressable>
                </View>
              </AuthFormField>

              <CaptchaField
                resetKey={captchaResetKey}
                onValidChange={handleCaptchaValid}
                onFocus={scrollFocusedFieldIntoView}
                compact={compact}
                error={fieldErrors.captcha}
              />

              {formError ? (
                <View style={styles.errorBox}>
                  <AuthFormAlert message={formError} />
                  {errorRoleHint ? (
                    <Pressable style={styles.switchRoleBtn} onPress={() => switchRole(errorRoleHint)}>
                      <Text style={styles.switchRoleText}>Use {ROLE_PORTALS[errorRoleHint].label} instead</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  compact && styles.primaryButtonCompact,
                  { backgroundColor: roleConfig.accent },
                  submitting && styles.buttonDisabled,
                ]}
                onPress={onSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign in</Text>
                )}
              </Pressable>

              <Pressable style={[styles.demoLink, compact && styles.demoLinkCompact]} onPress={fillDemo}>
                <Ionicons name="flash-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.demoLinkText} numberOfLines={1}>
                  Demo {roleConfig.label.toLowerCase()} · password: password
                </Text>
              </Pressable>
            </>
          ) : (
            <SignupForm
              role={role}
              hideRoleSelector
              captchaResetKey={captchaResetKey}
              onOpenLegal={setLegalDoc}
              onSuccess={() => { setMode('signin'); clearAuthErrors(); setEmail(roleConfig.demoEmail); setCaptchaValid(false); }}
            />
          )}
        </View>
      </View>

      <View style={[styles.legalRow, compact && styles.legalRowCompact]}>
        <Pressable onPress={() => setLegalDoc('privacy')}>
          <Text style={styles.legalLink}>Privacy</Text>
        </Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable onPress={() => setLegalDoc('terms')}>
          <Text style={styles.legalLink}>Terms</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AuthMeshBackground />
      <View style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            wide ? styles.pageWideScroll : styles.pageScroll,
            keyboardVisible && styles.pageScrollKeyboard,
            { paddingBottom: 16 + keyboardInset },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {wide ? (
            <View style={styles.pageWide}>
              <View style={styles.heroCol}>
                <FleetPilotLogoMark size={48} />
                <Text style={styles.heroTitle}>FleetPilot</Text>
                <Text style={styles.heroSub}>School bus app for drivers and parents</Text>
              </View>
              <View style={styles.cardWrap}>{card}</View>
            </View>
          ) : (
            <View style={styles.cardWrap}>{card}</View>
          )}
        </ScrollView>
      </View>
      <LegalPolicyModal visible={legalDoc !== null} documentId={legalDoc} onClose={() => setLegalDoc(null)} />
    </SafeAreaView>
  );
}

/** @deprecated Use AuthScreen */
export const LoginScreen = AuthScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundAuth },
  flex: { flex: 1 },
  pageScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pageScrollKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  pageWideScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pageWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  signupScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  cardWrap: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  heroCol: { flex: 1, maxWidth: 320 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: Colors.secondary, marginTop: 14 },
  heroSub: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },
  card: {
    ...ui.card,
    borderTopWidth: 3,
    overflow: 'hidden',
    width: '100%',
  },
  cardWide: { flex: 1, maxWidth: 420 },
  cardHeader: {
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundMuted,
  },
  cardHeaderCompact: { paddingTop: 12, paddingBottom: 0 },
  logoBadge: { borderRadius: 14, padding: 8, marginBottom: 6 },
  logoBadgeCompact: { padding: 6, marginBottom: 4 },
  brandName: { fontSize: 18, fontWeight: '800', color: Colors.secondary },
  brandNameCompact: { fontSize: 17 },
  brandTag: { fontSize: 12, fontWeight: '600', marginTop: 1, marginBottom: 8 },
  cardInner: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  cardInnerCompact: { paddingTop: 10 },
  sectionHint: { fontSize: 12, color: Colors.textMuted, marginBottom: 8, textAlign: 'center' },
  headline: { marginTop: 10, alignItems: 'center' },
  headlineCompact: { marginTop: 8 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.secondary, textAlign: 'center' },
  titleCompact: { fontSize: 17 },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4, lineHeight: 18, textAlign: 'center' },
  subtitleCompact: { fontSize: 12, lineHeight: 16 },
  perkRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8 },
  perk: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  segment: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    padding: 3,
  },
  segmentCompact: { marginTop: 8 },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: Colors.surface },
  segmentText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  segmentTextActive: { color: Colors.secondary, fontWeight: '700' },
  cardBody: { paddingTop: 10 },
  cardBodyCompact: { paddingTop: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 9,
    backgroundColor: Colors.surface,
  },
  inputRowCompact: { paddingVertical: Platform.OS === 'ios' ? 9 : 7 },
  input: { flex: 1, fontSize: 15, color: Colors.secondary, padding: 0 },
  primaryButton: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 2 },
  primaryButtonCompact: { paddingVertical: 11 },
  primaryButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  demoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  demoLinkCompact: { paddingVertical: 6 },
  demoLinkText: { fontSize: 12, color: Colors.textMuted, flexShrink: 1 },
  errorBox: { gap: 6, marginBottom: 2 },
  switchRoleBtn: { alignItems: 'center', paddingVertical: 4 },
  switchRoleText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundMuted,
  },
  legalRowCompact: { paddingVertical: 8 },
  legalLink: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  legalDot: { fontSize: 11, color: Colors.placeholder },
});
