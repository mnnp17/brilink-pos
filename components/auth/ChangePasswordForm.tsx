'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDashboardPathForRole, resolveUserRole } from '@/lib/utils/auth-routing'
import { toast } from 'sonner'

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password minimal 8 karakter')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', user.id)
      }

      const role = await resolveUserRole(supabase, user!.id)

      toast.success('Password berhasil diubah!')
      window.location.href = getDashboardPathForRole(role)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah password'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-2">
            Password Baru
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            required
            minLength={8}
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
            Konfirmasi Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password baru"
            required
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
        </div>
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-red-400 text-xs">Password tidak cocok</p>
        )}
        <button
          type="submit"
          disabled={loading}
          id="btn-change-password"
          className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Memproses...' : 'Simpan Password Baru'}
        </button>
      </form>
    </div>
  )
}
