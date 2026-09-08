import { z } from 'zod';

export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter').regex(/^[a-zA-Z0-9_]+$/, 'Username hanya huruf, angka, dan underscore'),
  outletId: z.string().uuid('Outlet ID tidak valid'),
  initialPassword: z.string().min(6, 'Password minimal 6 karakter'),
});

export const createAccountSchema = z.object({
  outletId: z.string().uuid('Outlet ID tidak valid'),
  name: z.string().min(2, 'Nama rekening/EDC minimal 2 karakter'),
  accountNumber: z.string().min(3, 'Nomor rekening/EDC tidak valid'),
  initialBalance: z.number().min(0, 'Saldo awal tidak boleh negatif').default(0),
  minThreshold: z.number().min(0, 'Batas minimal saldo tidak boleh negatif').default(0),
  type: z.enum(['CASH_DRAWER', 'BANK_BRI', 'EDC_TERMINAL', 'PPOB_BALANCE']).default('BANK_BRI'),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
