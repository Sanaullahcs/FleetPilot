import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@/components/ui/icons';
import { Colors } from '@/constants/theme';
import { createCaptchaChallenge, isCaptchaAnswerValid, type CaptchaChallenge } from '@/lib/captcha';

export function CaptchaField({
  onValidChange,
  onFocus,
  resetKey = 0,
  compact = false,
  error,
}: {
  onValidChange: (valid: boolean) => void;
  onFocus?: () => void;
  resetKey?: number | string;
  compact?: boolean;
  /** Parent validation message (e.g. on submit when empty or wrong). */
  error?: string | null;
}) {
  const { width } = useWindowDimensions();
  const narrow = width < 360;
  const tight = compact || narrow;

  const [challenge, setChallenge] = useState<CaptchaChallenge>(() => createCaptchaChallenge());
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const refresh = () => {
    setChallenge(createCaptchaChallenge());
    setValue('');
    setTouched(false);
    onValidChange(false);
  };

  useEffect(() => {
    setChallenge(createCaptchaChallenge());
    setValue('');
    setTouched(false);
    onValidChange(false);
  }, [resetKey, onValidChange]);

  useEffect(() => {
    onValidChange(isCaptchaAnswerValid(challenge, value));
  }, [challenge, value, onValidChange]);

  const answerInvalid = touched && value.length > 0 && !isCaptchaAnswerValid(challenge, value);
  const showError = Boolean(error) || answerInvalid;
  const errorMessage = error ?? (answerInvalid ? 'Incorrect answer. Try again or refresh.' : null);

  return (
    <View style={[styles.wrap, tight && styles.wrapCompact]}>
      <Text style={[styles.label, showError && styles.labelError]}>Security check</Text>

      <View style={[styles.captchaRow, tight && styles.captchaRowCompact]}>
        <View style={[styles.questionBox, tight && styles.questionBoxCompact, showError && styles.boxInvalid]}>
          <Ionicons name="shield-checkmark-outline" size={tight ? 14 : 15} color={Colors.primary} />
          <Text style={[styles.question, tight && styles.questionCompact]} numberOfLines={1}>
            {challenge.question} = ?
          </Text>
        </View>

        <TextInput
          value={value}
          onChangeText={setValue}
          onFocus={onFocus}
          onBlur={() => setTouched(true)}
          keyboardType="number-pad"
          placeholder="Answer"
          placeholderTextColor={Colors.placeholder}
          style={[
            styles.answerInput,
            tight && styles.answerInputCompact,
            showError && styles.inputInvalid,
          ]}
          maxLength={3}
        />

        <Pressable
          style={[styles.refreshBtn, tight && styles.refreshBtnCompact]}
          onPress={refresh}
          accessibilityLabel="New captcha"
        >
          <Ionicons name="refresh" size={tight ? 16 : 18} color={Colors.textMuted} />
        </Pressable>
      </View>

      {errorMessage ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={Colors.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  wrapCompact: { marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.label, marginBottom: 6 },
  labelError: { color: Colors.danger },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  captchaRowCompact: { gap: 6 },
  questionBox: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: `${Colors.primary}22`,
  },
  questionBoxCompact: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  question: {
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  questionCompact: { fontSize: 14 },
  answerInput: {
    width: 76,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    backgroundColor: Colors.surface,
    textAlign: 'center',
  },
  answerInputCompact: {
    width: 68,
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 15,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  refreshBtnCompact: {
    width: 36,
    height: 36,
  },
  boxInvalid: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  inputInvalid: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 5 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 16, color: Colors.danger, fontWeight: '500' },
});
