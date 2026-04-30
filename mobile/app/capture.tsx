import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { parseReceiptPipeline } from '../src/features/receipt/pipeline';
import { PipelineResult } from '../src/features/receipt/schema';
import { createTransaction } from '../src/features/transactions/repository';
import { transactionQueryKeys } from '../src/features/transactions/hooks';
import { useTransactionDraftStore } from '../src/features/transactions/useTransactionDraftStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { spacing, radius } from '../src/theme/tokens';
import { parseAmountToMinor } from '../src/lib/money';
import { isValidISODate, normalizeCurrencyCode, sanitizeText } from '../src/lib/validation';
import { ConfidenceBadge } from '../src/components/ConfidenceBadge';
import { CategoryPicker } from '../src/components/CategoryPicker';

type CaptureMode = 'camera' | 'parsing' | 'review';

export default function CaptureScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<CaptureMode>('camera');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const { draft, setDraft, clearDraft } = useTransactionDraftStore();
  const [confidence, setConfidence] = useState({ merchant: 0, amount: 0, date: 0 });
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const onCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) {
        Alert.alert('Capture failed', 'Please try taking the receipt photo again.');
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCapturedUri(photo.uri);
      setMode('parsing');

      const result = await parseReceiptPipeline(photo.uri);
      setPipelineResult(result);

      const p = result.parsed;
      setDraft({
        merchant: p.merchant ?? '',
        amount: p.amount_total ? (p.amount_total / 100).toFixed(2) : '',
        currency: p.currency ?? 'MYR',
        occurredOn: p.date ?? new Date().toISOString().slice(0, 10),
        category: p.suggested_category ?? '',
      });
      setConfidence({
        merchant: p.confidence.merchant,
        amount: p.confidence.amount_total,
        date: p.confidence.date,
      });
      setMode('review');
    } catch {
      Alert.alert('Parsing failed', "Couldn't read this one. Tap to enter it manually — your photo stays on your phone.");
      setMode('review');
    } finally {
      setIsCapturing(false);
    }
  };

  const onSave = async () => {
    if (isSaving) return;

    const merchant = sanitizeText(draft.merchant);
    const category = sanitizeText(draft.category);
    const currency = normalizeCurrencyCode(draft.currency);
    const occurredOn = draft.occurredOn.trim();

    if (!merchant || !draft.amount || !category) {
      Alert.alert('Missing fields', 'Please fill merchant, amount, and category before saving.');
      return;
    }
    if (!isValidISODate(occurredOn)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format for the transaction date.');
      return;
    }

    const amountMinor = parseAmountToMinor(draft.amount);
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
        source: 'snap',
        receiptImageUri: capturedUri,
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.monthlyTotal }),
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.monthlyCategory }),
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.dailySpend }),
      ]);

      clearDraft();
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown save error';
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const onRetake = () => {
    clearDraft();
    setCapturedUri(null);
    setPipelineResult(null);
    setConfidence({ merchant: 0, amount: 0, date: 0 });
    setMode('camera');
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceBase }]}>
        <Text style={[styles.subtitle, { color: colors.ink500 }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.surfaceBase }]}>
        <Text style={[styles.subtitle, { color: colors.ink500 }]}>
          Camera permission is required to snap receipts.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={[styles.secondaryButton, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          accessibilityRole="button"
          accessibilityLabel="Allow camera access"
        >
          <Text style={[styles.secondaryLabel, { color: colors.ink700 }]}>Allow camera access</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === 'camera') {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceBase }]}>
        <Text style={[styles.subtitle, { color: colors.ink500 }]}>
          Frame the receipt and tap capture.
        </Text>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <Pressable
          onPress={onCapture}
          style={[styles.captureButton, { backgroundColor: colors.brandPrimary }, isCapturing && styles.disabled]}
          disabled={isCapturing}
          accessibilityRole="button"
          accessibilityLabel={isCapturing ? 'Capturing receipt' : 'Capture receipt'}
        >
          <Text style={styles.captureLabel}>{isCapturing ? 'Capturing...' : 'Capture receipt'}</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === 'parsing') {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.surfaceBase }]}>
        {capturedUri && <Image source={{ uri: capturedUri }} style={styles.preview} />}
        <ActivityIndicator color={colors.brandPrimaryDeep} />
        <View style={[styles.onDeviceBadge, { backgroundColor: colors.surfaceSunken }]}>
          <Text style={[styles.onDeviceText, { color: colors.ink700 }]}>On-device parsing</Text>
        </View>
      </View>
    );
  }

  const lineItems = pipelineResult?.parsed.line_items ?? [];

  return (
    <ScrollView
      style={[styles.scrollContainer, { backgroundColor: colors.surfaceBase }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.sourceBadge, { backgroundColor: colors.surfaceSunken }]}>
        <Text style={[styles.sourceText, { color: colors.ink500 }]}>
          {pipelineResult?.source === 'llm' ? 'AI parsed' : pipelineResult?.source === 'ocr+rules' ? 'OCR parsed' : 'Manual entry'}
          {' · '}
          {pipelineResult?.ocrEngine === 'mlkit' ? 'ML Kit' : 'Fallback'}
        </Text>
      </View>

      {capturedUri && <Image source={{ uri: capturedUri }} style={styles.preview} />}

      <View style={styles.fieldWrap}>
        <View style={styles.fieldHeader}>
          <Text style={[styles.label, { color: colors.ink700 }]}>Merchant</Text>
          <ConfidenceBadge value={confidence.merchant} />
        </View>
        <TextInput
          value={draft.merchant}
          onChangeText={(v) => setDraft({ merchant: v })}
          placeholder="e.g. Starbucks KLCC"
          style={[styles.input, { borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised }]}
          placeholderTextColor={colors.ink500}
          accessibilityLabel="Merchant name"
        />
      </View>

      <View style={styles.fieldWrap}>
        <View style={styles.fieldHeader}>
          <Text style={[styles.label, { color: colors.ink700 }]}>Amount</Text>
          <ConfidenceBadge value={confidence.amount} />
        </View>
        <View style={styles.amountRow}>
          <TextInput
            value={draft.currency}
            onChangeText={(v) => setDraft({ currency: v })}
            style={[styles.currencyInput, { borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised }]}
            autoCapitalize="characters"
            maxLength={3}
            accessibilityLabel="Currency code"
          />
          <TextInput
            value={draft.amount}
            onChangeText={(v) => setDraft({ amount: v })}
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={[styles.input, { flex: 1, borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised }]}
            placeholderTextColor={colors.ink500}
            accessibilityLabel="Amount"
          />
        </View>
      </View>

      <View style={styles.fieldWrap}>
        <View style={styles.fieldHeader}>
          <Text style={[styles.label, { color: colors.ink700 }]}>Date</Text>
          <ConfidenceBadge value={confidence.date} />
        </View>
        <TextInput
          value={draft.occurredOn}
          onChangeText={(v) => setDraft({ occurredOn: v })}
          placeholder="YYYY-MM-DD"
          style={[styles.input, { borderColor: colors.strokeSubtle, color: colors.ink900, backgroundColor: colors.surfaceRaised }]}
          placeholderTextColor={colors.ink500}
          accessibilityLabel="Transaction date"
        />
      </View>

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.ink700 }]}>Category</Text>
        <Pressable
          onPress={() => setShowCategoryPicker(true)}
          style={[styles.input, styles.pickerButton, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          accessibilityRole="button"
          accessibilityLabel={`Category: ${draft.category || 'not set'}`}
        >
          <Text style={{ color: draft.category ? colors.ink900 : colors.ink500, fontSize: 16 }}>
            {draft.category || 'Select category'}
          </Text>
        </Pressable>
      </View>

      {lineItems.length > 0 && (
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.ink700 }]}>
            {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''}
          </Text>
          {lineItems.map((item, idx) => (
            <View key={idx} style={[styles.lineItem, { borderBottomColor: colors.strokeSubtle }]}>
              <Text style={[styles.lineDesc, { color: colors.ink900 }]}>{item.description}</Text>
              <Text style={[styles.lineAmt, { color: colors.ink700 }]}>
                {(item.amount / 100).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.reviewActions}>
        <Pressable
          onPress={onRetake}
          style={[styles.secondaryButton, { borderColor: colors.strokeSubtle, backgroundColor: colors.surfaceRaised }]}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Retake photo"
        >
          <Text style={[styles.secondaryLabel, { color: colors.ink700 }]}>Retake</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          style={[styles.saveButton, { backgroundColor: colors.brandPrimary }, isSaving && styles.disabled]}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel={isSaving ? 'Saving transaction' : 'Save transaction'}
        >
          <Text style={styles.saveLabel}>{isSaving ? 'Saving...' : 'Save transaction'}</Text>
        </Pressable>
      </View>

      <CategoryPicker
        visible={showCategoryPicker}
        selected={draft.category}
        onSelect={(name) => setDraft({ category: name })}
        onClose={() => setShowCategoryPicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
  },
  captureButton: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    minHeight: 52,
  },
  captureLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  onDeviceBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  onDeviceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sourceBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fieldWrap: {
    gap: spacing.xs,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  lineDesc: {
    fontSize: 14,
    flex: 1,
  },
  lineAmt: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  reviewActions: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
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
