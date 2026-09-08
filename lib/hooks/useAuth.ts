'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkImpersonation = () => {
      if (typeof window !== 'undefined') {
        const impersonated = sessionStorage.getItem('impersonated_user');
        if (impersonated) {
          try {
            setProfile(JSON.parse(impersonated));
            setLoading(false);
            return true;
          } catch (e) {
            sessionStorage.removeItem('impersonated_user');
          }
        }
      }
      return false;
    };

    const fetchProfile = async () => {
      if (checkImpersonation()) return;

      // Synchronous Mock Session Check (Instant & Offline-Safe)
      if (typeof window !== 'undefined') {
        if (localStorage.getItem('owner-mock-session') === 'true') {
          setProfile({
            id: '00000000-0000-0000-0000-000000000001',
            full_name: 'H. Ahmad Subagyo',
            role: 'owner',
            must_change_password: false,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            outlet_id: '00000000-0000-0000-0000-000000000000',
          })
          setLoading(false)
          return
        }
        if (localStorage.getItem('cashier-mock-session') === 'true') {
          const activeId = localStorage.getItem('active-cashier-id') || 'mock-cashier-id';
          
          let cashierName = 'Kasir Outlet';
          let cashierPermissions: any = {
            canProcessPos: true,
            canManageShift: true,
            canApplyCustomDiscount: false,
            canRebalance: false,
            canProcessExpense: true,
            canViewHistory: true,
            canReprintReceipt: true,
            canVoidTransaction: false,
          };

          const storedStaff = localStorage.getItem('pos-staff-users');
          if (storedStaff) {
            try {
              const staffList = JSON.parse(storedStaff) as any[];
              const found = staffList.find(s => s.id === activeId || (activeId === 'mock-naufal-id' && s.username === 'naufal'));
              if (found) {
                cashierName = found.fullName;
                if (found.permissions) {
                  cashierPermissions = found.permissions;
                }
              }
            } catch (e) {}
          }

          setProfile({
            id: activeId,
            full_name: cashierName,
            role: 'kasir',
            must_change_password: false,
            is_active: true,
            permissions: cashierPermissions,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            outlet_id: '00000000-0000-0000-0000-000000000000',
          })
          setLoading(false)
          return
        }
      }

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          setProfile(null)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // Get permissions from pos-staff-users if available
        let userPermissions: any = undefined;
        if (typeof window !== 'undefined') {
          const storedStaff = localStorage.getItem('pos-staff-users');
          if (storedStaff) {
            try {
              const staffList = JSON.parse(storedStaff) as any[];
              const found = staffList.find(s => s.id === user.id || s.username === user.email?.split('@')[0]);
              if (found?.permissions) {
                userPermissions = found.permissions;
              }
            } catch (e) {}
          }
        }

        if (data && !error) {
          const rawRole = (data.role ?? 'kasir').toLowerCase();
          const normalizedRole = rawRole === 'karyawan' ? 'kasir' : rawRole;
          setProfile({
            ...data,
            role: normalizedRole,
            permissions: userPermissions,
          } as any)
        } else {
          // Fallback to local user session metadata if profiles DB query returns null or errors out
          const rawRole = (user.user_metadata?.role ?? 'KASIR').toLowerCase();
          const normalizedRole = rawRole === 'karyawan' ? 'kasir' : rawRole;
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? 'Kasir Outlet',
            role: normalizedRole,
            must_change_password: false,
            is_active: true,
            permissions: userPermissions,
            created_at: user.created_at ?? new Date().toISOString(),
            updated_at: user.updated_at ?? new Date().toISOString(),
            outlet_id: user.user_metadata?.outlet_id ?? undefined,
          } as any)
        }
      } catch (err) {
        console.error('Error fetching user profile, using metadata fallback:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    const handleImpersonationChange = () => {
      if (!checkImpersonation()) {
        fetchProfile();
      }
    };

    const handleStaffUpdate = () => {
      fetchProfile();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('impersonation-changed', handleImpersonationChange);
      window.addEventListener('pos-staff-updated', handleStaffUpdate);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (typeof window !== 'undefined' && (
        localStorage.getItem('owner-mock-session') === 'true' ||
        localStorage.getItem('cashier-mock-session') === 'true'
      )) {
        // Ignore Auth changes during mock session testing
        return;
      }
      if (!session) {
        if (!checkImpersonation()) {
          setProfile(null)
        }
      } else {
        fetchProfile()
      }
    })

    return () => {
      subscription.unsubscribe()
      if (typeof window !== 'undefined') {
        window.removeEventListener('impersonation-changed', handleImpersonationChange);
      }
    }
  }, [supabase])

  const signOut = async () => {
    localStorage.removeItem('owner-mock-session')
    localStorage.removeItem('cashier-mock-session')
    localStorage.removeItem('active-cashier-id')
    if (typeof window !== 'undefined') {
      document.cookie = "owner-mock-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "cashier-mock-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      sessionStorage.removeItem('impersonated_user')
      await supabase.auth.signOut()
      window.location.href = '/login'
    } else {
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  return { profile, loading, signOut }
}
