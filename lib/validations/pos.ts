import { z } from 'zod';

export const transactionTypeEnum = z.enum(['SETOR_TUNAI', 'TARIK_TUNAI', 'PPOB']);

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const transactionSchema = z.object({
  shiftId: z.string().regex(uuidRegex, 'Shift ID tidak valid'),
  accountId: z.string().regex(uuidRegex, 'Account ID (Rekening/EDC) tidak valid'),
  type: transactionTypeEnum,
  amount: z.number().positive('Nominal transaksi harus lebih dari 0'),
  adminFee: z.number().min(0, 'Biaya admin tidak boleh negatif').default(0),
  bankFee: z.number().min(0, 'Biaya bank COGS tidak boleh negatif').default(0),
  paymentMethod: z.enum(['CASH', 'DEPOSIT', 'STORE_BALANCE', 'CUSTOMER_BALANCE']).optional(),
  accountNumber: z.string().optional(),
  idempotencyKey: z.string().min(1, 'Idempotency Key wajib diisi'),
});

export const batchSyncSchema = z.array(transactionSchema);

export type TransactionInput = z.infer<typeof transactionSchema>;
export type BatchSyncInput = z.infer<typeof batchSyncSchema>;
