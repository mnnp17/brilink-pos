import { z } from 'zod';

export const createOwnerAndOutletSchema = z.object({
  ownerEmail: z.string().email('Email Owner tidak valid'),
  ownerName: z.string().min(2, 'Nama Owner minimal 2 karakter'),
  ownerPassword: z.string().min(8, 'Password Owner minimal 8 karakter'),
  outletName: z.string().min(2, 'Nama Outlet minimal 2 karakter'),
  outletAddress: z.string().optional(),
});

export const impersonateOwnerSchema = z.object({
  ownerId: z.string().uuid('Owner ID tidak valid'),
});

export type CreateOwnerAndOutletInput = z.infer<typeof createOwnerAndOutletSchema>;
export type ImpersonateOwnerInput = z.infer<typeof impersonateOwnerSchema>;
