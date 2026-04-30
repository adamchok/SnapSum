import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { listTransactions } from './repository';
import { formatMinorToCurrency } from '../../lib/money';

export async function exportTransactionsToCsv(): Promise<{ fileUri: string; shared: boolean }> {
  const transactions = await listTransactions(5000);
  if (transactions.length === 0) {
    throw new Error('No transactions to export yet.');
  }

  const csv = toCsv(transactions);
  const now = new Date().toISOString().slice(0, 10);

  if (!FileSystem.cacheDirectory) {
    throw new Error('Cache directory unavailable for export.');
  }

  const fileUri = `${FileSystem.cacheDirectory}snapsum-transactions-${now}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Export SnapSum Transactions',
    });
    return { fileUri, shared: true };
  }

  return { fileUri, shared: false };
}

type ExportRow = {
  id: string;
  merchant: string;
  amountMinor: number;
  currency: string;
  occurredOn: string;
  category: string;
  source: 'snap' | 'manual';
  receiptImageUri?: string | null;
  createdAt: string;
};

function toCsv(rows: ExportRow[]): string {
  const header = [
    'id',
    'merchant',
    'amount_minor',
    'amount_display',
    'currency',
    'occurred_on',
    'category',
    'source',
    'receipt_image_uri',
    'created_at',
  ];

  const dataRows = rows.map((row) => [
    row.id,
    row.merchant,
    String(row.amountMinor),
    formatMinorToCurrency(row.amountMinor, row.currency),
    row.currency,
    row.occurredOn,
    row.category,
    row.source,
    row.receiptImageUri ?? '',
    row.createdAt,
  ]);

  return [header, ...dataRows].map((line) => line.map(escapeCsvCell).join(',')).join('\n');
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
