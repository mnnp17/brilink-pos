import { z } from 'zod';

export const openShiftSchema = z.object({
  startCash: z.number().min(0, 'Kas awal laci tidak boleh negatif'),
  outletId: z.string().uuid('Outlet ID tidak valid'),
});

export const closeShiftSchema = z.object({
  shiftId: z.string().uuid('Shift ID tidak valid'),
  actualCash: z.number().min(0, 'Kas fisik laci tidak boleh negatif'),
});

export type OpenShiftInput = z.infer<typeof openShiftSchema>;
export type CloseShiftInput = z.infer<typeof closeShiftSchema>;
