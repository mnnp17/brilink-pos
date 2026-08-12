import { z } from 'zod'

export const createTransactionSchema = z.object({
  type: z.enum(['setor_tunai', 'tarik_tunai', 'ppob', 'pulsa', 'transfer_internal', 'cash_drop']),
  account_id: z.string().uuid({ message: 'Wajib pilih rekening' }),
  shift_id: z.string().uuid().optional(),
  nominal: z.number()
    .min(1000, 'Nominal minimal Rp 1.000')
    .max(100000000, 'Nominal maksimal Rp 100.000.000'),
  fee_amount: z.number().min(0).default(0),
  modal_price: z.number().min(0).default(0),
  sell_price: z.number().min(0).default(0),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  destination_account: z.string().optional(),
  notes: z.string().optional(),
})

export const openShiftSchema = z.object({
  opening_cash: z.number().min(0, 'Kas awal tidak boleh negatif'),
})

export const closeShiftSchema = z.object({
  closing_cash: z.number().min(0, 'Kas akhir tidak boleh negatif'),
})

export const createAccountSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  account_type: z.enum(['bank_bri', 'edc_mobile', 'bank_lain', 'kas_laci']),
  account_number: z.string().optional(),
  bank_name: z.string().optional(),
  initial_balance: z.number().min(0).default(0),
  min_threshold: z.number().min(0).default(500000),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  icon: z.string().default('bank'),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type OpenShiftInput = z.infer<typeof openShiftSchema>
export type CloseShiftInput = z.infer<typeof closeShiftSchema>
export type CreateAccountInput = z.infer<typeof createAccountSchema>
