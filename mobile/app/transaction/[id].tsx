import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTransactionDetailQuery, transactionQueryKeys } from '../../src/features/transactions/hooks';
import {
  deleteTransactionById,
  updateTransactionById,
} from '../../src/features/transactions/repository';
import { parseAmountToMinor } from '../../src/lib/money';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';
import { isValidISODate, normalizeCurrencyCode, sanitizeText } from '../../src/lib/validation';
import { CategoryPicker } from '../../src/components/CategoryPicker';

type EditFormState = {
  merchant: string;
  amount: string;
  currency: string;
  occurredOn: string;
  category: string;
};

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const transactionId = params.id ?? '';
  const detailQuery = useTransactionDetailQuery(transactionId);

  const [form, setForm] = useState<EditFormState>({
    merchant: '',
    amount: '',
    currency: 'MYR',
    occurredOn: new Date().toISOString().slice(0, 10),
    category: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (!detailQuery.data) return;
    setForm({
      merchant: detailQuery.data.merchant,
      amount: (detailQuery.data.amountMinor / 100).toFixed(2),
      currency: detailQuery.data.currency,
      occurredOn: detailQuery.data.occurredOn,
      category: detailQuery.data.category,
    });
  }, [detailQuery.data]);

  const lastUpdatedLabel = useMemo(() => {
    if (!detailQuery.data) return '';
    return `Created ${detailQuery.data.createdAt.slice(0, 10)} · Source: ${detailQuery.data.source}`;
  }, [detailQuery.data]);

  const onChange = <K extends keyof EditFormState>(field: K, value: EditFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSave = async () => {
    if (!transactionId || isSaving || !detailQuery.data) return;

    const merchant = sanitizeText(form.merchant);
    const category = sanitizeText(form.category);
    const currency = normalizeCurrencyCode(form.currency);
    const occurredOn = form.occurredOn.trim();

    if (!merchant || !category) {
      Alert.alert('Missing fields', 'Merchant and category are required.');
      return;
    }
    if (!isValidISODate(occurredOn)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format for the transaction date.');
      return;
    }

    const amountMinor = parseAmountToMinor(form.amount);
    if (amountMinor === null || amountMinor <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount such as 18.90.');
      return;
    }

    setIsSaving(true);
    try {
      await updateTransactionById(transactionId, {
        merchant,
        amountMinor,
        currency,
        occurredOn,
        category,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await invalidateTransactionQueries(queryClient, transactionId);
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown update error';
      Alert.alert('Update failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const askDelete = () => {
    if (!transactionId || isDeleting || !detailQuery.data) return;
    Alert.alert('Delete transaction?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void onDelete(),
      },
    ]);
  };

  const onDelete = async () => {
    if (!transactionId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTransactionById(transactionId);
      await invalidateTransactionQueries(queryClient, transactionId);
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown delete error';
      Alert.alert('Delete failed', message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (detailQuery.isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.surfaceBase }]}>
        <Text style={[styles.meta, { color: colors.ink500 }]}>Loading transaction...</Text>
      </View>
    );
  }

  if (!detailQuery.data) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.surfaceBase }]}>
        <Text style={[styles.title, { color: colors.ink900 }]}>Transaction not found</Text>
        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.secondaryButtonText, { color: colors.ink700 }]}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.surfaceBase }]}
    >
      <Text style={[styles.title, { color: colors.ink900 }]}>Edit Transaction</Text>
      <Text style={[styles.meta, { color: colors.ink500 }]}>{lastUpdatedLabel}</Text>

      <Field label="Merchant" value={form.merchant} onChangeText={(v) => onChange('merchant', v)} colors={colors} />
      <Field
        label="Amount"
        value={form.amount}
        keyboardType="decimal-pad"
        onChangeText={(v) => onChange('amount', v)}
        colors={colors}
      />
      <Field
        label="Currency (ISO)"
        value={form.currency}
        autoCapitalize="characters"
        onChangeText={(v) => onChange('currency', v)}
        colors={colors}
      />
      <Field
        label="Date (YYYY-MM-DD)"
        value={form.occurredOn}
        onChangeText={(v) => onChange('occurredOn', v)}
        colors={colors}
      />

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.ink700 }]}>Category</Text>
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

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          onPress={askDelete}
          disabled={isSaving || isDeleting}
          accessibilityRole="button"
          accessibilityLabel={isDeleting ? 'Deleting' : 'Delete transaction'}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.stateDanger }]}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.brandPrimary }, (isSaving || isDeleting) && styles.disabled]}
          onPress={onSave}
          disabled={isSaving || isDeleting}
          accessibilityRole="button"
          accessibilityLabel={isSaving ? 'Saving' : 'Save changes'}
        >
          <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>
      </View>

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
  onChangeText: (value: string) => void;
  colors: Record<string, string>;
  keyboardType?: 'default' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function Field({
  label,
  value,
  onChangeText,
  colors,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.ink700 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised }]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={colors.ink500}
        accessibilityLabel={label}
      />
    </View>
  );
}

async function invalidateTransactionQueries(
  queryClient: ReturnType<typeof import('@tanstack/react-query').useQueryClient>,
  id: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: transactionQueryKeys.monthlyTotal }),
    queryClient.invalidateQueries({ queryKey: transactionQueryKeys.monthlyCategory }),
    queryClient.invalidateQueries({ queryKey: transactionQueryKeys.dailySpend }),
    queryClient.invalidateQueries({ queryKey: transactionQueryKeys.detail(id) }),
  ]);
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  pickerButton: {
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
