import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { createTransaction } from '../../src/features/transactions/repository';
import { transactionQueryKeys } from '../../src/features/transactions/hooks';
import { parseAmountToMinor } from '../../src/lib/money';
import { isValidISODate, normalizeCurrencyCode, sanitizeText } from '../../src/lib/validation';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';
import { CategoryPicker } from '../../src/components/CategoryPicker';

export default function NewTransactionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [form, setForm] = useState({
    merchant: '',
    amount: '',
    currency: 'MYR',
    occurredOn: new Date().toISOString().slice(0, 10),
    category: '',
  });

  const onChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (isSaving) return;

    const merchant = sanitizeText(form.merchant);
    const category = sanitizeText(form.category);
    const currency = normalizeCurrencyCode(form.currency);
    const occurredOn = form.occurredOn.trim();

    if (!merchant || !form.amount || !category) {
      Alert.alert('Missing fields', 'Please fill merchant, amount, and category.');
      return;
    }
    if (!isValidISODate(occurredOn)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format.');
      return;
    }

    const amountMinor = parseAmountToMinor(form.amount);
    if (amountMinor === null || amountMinor <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount like 18.90');
      return;
    }

    setIsSaving(true);
    try {
      await createTransaction({
        merchant,
        amountMinor,
        currency,
        occurredOn,
        category,
        source: 'manual',
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.monthlyTotal }),
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.monthlyCategory }),
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.dailySpend }),
      ]);

      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown save error';
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surfaceBase }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.ink900 }]}>Add Transaction</Text>
      <Text style={[styles.subtitle, { color: colors.ink500 }]}>Enter the details manually.</Text>

      <Field
        label="Merchant"
        value={form.merchant}
        onChangeText={(v) => onChange('merchant', v)}
        placeholder="e.g. Starbucks KLCC"
        colors={colors}
      />

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.ink700 }]}>Amount</Text>
        <View style={styles.amountRow}>
          <TextInput
            value={form.currency}
            onChangeText={(v) => onChange('currency', v)}
            style={[styles.currencyInput, { borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised }]}
            autoCapitalize="characters"
            maxLength={3}
            accessibilityLabel="Currency code"
          />
          <TextInput
            value={form.amount}
            onChangeText={(v) => onChange('amount', v)}
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={[styles.input, { flex: 1, borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised }]}
            placeholderTextColor={colors.ink500}
            accessibilityLabel="Amount"
          />
        </View>
      </View>

      <Field
        label="Date (YYYY-MM-DD)"
        value={form.occurredOn}
        onChangeText={(v) => onChange('occurredOn', v)}
        placeholder="YYYY-MM-DD"
        colors={colors}
      />

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.ink700 }]}>Category</Text>
        <Pressable
          onPress={() => setShowCategoryPicker(true)}
          style={[styles.input, styles.pickerButton, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          accessibilityRole="button"
          accessibilityLabel={`Category: ${form.category || 'not set'}`}
        >
          <Text style={{ color: form.category ? colors.ink900 : colors.ink500, fontSize: 16 }}>
            {form.category || 'Select category'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onSave}
        style={[styles.saveButton, { backgroundColor: colors.brandPrimary }, isSaving && styles.disabled]}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel={isSaving ? 'Saving' : 'Save transaction'}
      >
        <Text style={styles.saveLabel}>{isSaving ? 'Saving...' : 'Save transaction'}</Text>
      </Pressable>

      <CategoryPicker
        visible={showCategoryPicker}
        selected={form.category}
        onSelect={(name) => onChange('category', name)}
        onClose={() => setShowCategoryPicker(false)}
      />
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: Record<string, string>;
  keyboardType?: 'default' | 'decimal-pad';
};

function Field({ label, value, onChangeText, placeholder, colors, keyboardType = 'default' }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.ink700 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        style={[styles.input, { borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised }]}
        placeholderTextColor={colors.ink500}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  fieldWrap: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    minHeight: 48,
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  currencyInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    width: 64,
    textAlign: 'center',
    fontWeight: '700',
    minHeight: 48,
  },
  pickerButton: {
    justifyContent: 'center',
  },
  saveButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    minHeight: 52,
  },
  saveLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
