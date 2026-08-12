import type { Metadata } from 'next'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'

export const metadata: Metadata = {
  title: 'Buat Password Baru',
  description: 'Buat password baru untuk akun Anda',
}

export default function ChangePasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Buat Password Baru</h1>
          <p className="text-slate-400 mt-2 text-sm">Demi keamanan akun, Anda wajib membuat password baru sebelum melanjutkan.</p>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  )
}
