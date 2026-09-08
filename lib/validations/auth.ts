import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
  confirmPassword: z.string().min(8, 'Konfirmasi password minimal 8 karakter'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
