import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';
import { useCategoriesQuery } from '../../src/features/categories/hooks';
import { useCreateBudget } from '../../src/features/budgets/hooks';
import { parseAmountToMinor } from '../../src/lib/money';

type EnvelopeDraft = {
  categoryId: string;
  categoryName: string;
  amount: string;
};

export default function NewBudgetScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const categoriesQuery = useCategoriesQuery();
  const createMutation = useCreateBudget();
  const categories = categoriesQuery.data ?? [];

  const [name, setName] = useState('Monthly Budget');
  const [currency, setCurrency] = useState('MYR');
  const [envelopes, setEnvelopes] = useState<EnvelopeDraft[]>([]);

  const addEnvelope = (categoryId: string, categoryName: string) => {
    if (envelopes.some((e) => e.categoryId === categoryId)) return;
    setEnvelopes((prev) => [...prev, { categoryId, categoryName, amount: '' }]);
  };

  const removeEnvelope = (categoryId: string) => {
    setEnvelopes((prev) => prev.filter((e) => e.categoryId !== categoryId));
  };

  const updateAmount = (categoryId: string, amount: string) => {
    setEnvelopes((prev) =>
      prev.map((e) => (e.categoryId === categoryId ? { ...e, amount } : e)),
    );
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Give your budget a name.');
      return;
    }

    const validEnvelopes = envelopes
      .map((e) => ({
        categoryId: e.categoryId,
        limitMinor: parseAmountToMinor(e.amount),
      }))
      .filter((e) => e.limitMinor !== null && e.limitMinor > 0) as Array<{
      categoryId: string;
      limitMinor: number;
    }>;

    if (validEnvelopes.length === 0) {
      Alert.alert('No envelopes', 'Add at least one category with a budget amount.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        period: 'monthly',
        currency: currency.toUpperCase(),
        envelopes: validEnvelopes,
      });
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed';
      Alert.alert('Error', message);
    }
  };

  const usedIds = new Set(envelopes.map((e) => e.categoryId));
  const available = categories.filter((c) => !usedIds.has(c.id));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surfaceBase }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.ink900 }]}>Create Budget</Text>

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.ink700 }]}>Budget name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[styles.input, { borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised }]}
          accessibilityLabel="Budget name"
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.ink700 }]}>Currency</Text>
        <TextInput
          value={currency}
          onChangeText={setCurrency}
          autoCapitalize="characters"
          maxLength={3}
          style={[styles.input, { borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised, width: 80 }]}
          accessibilityLabel="Currency code"
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.ink900 }]}>Envelopes</Text>

      {envelopes.map((env) => (
        <View
          key={env.categoryId}
          style={[styles.envRow, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
        >
          <View style={styles.envHeader}>
            <Text style={[styles.envName, { color: colors.ink900 }]}>{env.categoryName}</Text>
            <Pressable
              onPress={() => removeEnvelope(env.categoryId)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${env.categoryName}`}
            >
              <Text style={{ color: colors.stateDanger, fontWeight: '600' }}>Remove</Text>
            </Pressable>
          </View>
          <TextInput
            value={env.amount}
            onChangeText={(v) => updateAmount(env.categoryId, v)}
            placeholder="Limit (e.g. 500.00)"
            keyboardType="decimal-pad"
            style={[styles.input, { borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceBase }]}
            placeholderTextColor={colors.ink500}
            accessibilityLabel={`${env.categoryName} budget limit`}
          />
        </View>
      ))}

      {available.length > 0 && (
        <View style={styles.addSection}>
          <Text style={[styles.label, { color: colors.ink500 }]}>Add category:</Text>
          <View style={styles.chipRow}>
            {available.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => addEnvelope(cat.id, cat.name)}
                style={[styles.chip, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${cat.name}`}
              >
                <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                <Text style={[styles.chipText, { color: colors.ink700 }]}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={onSave}
        style={[styles.saveButton, { backgroundColor: colors.brandPrimary }, createMutation.isPending && styles.disabled]}
        disabled={createMutation.isPending}
        accessibilityRole="button"
        accessibilityLabel="Create budget"
      >
        <Text style={styles.saveLabel}>
          {createMutation.isPending ? 'Creating...' : 'Create budget'}
        </Text>
      </Pressable>
    </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
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
  envRow: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  envHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  envName: {
    fontSize: 16,
    fontWeight: '600',
  },
  addSection: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
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
