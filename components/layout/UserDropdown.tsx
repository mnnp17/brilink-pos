"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAutoShift } from "@/lib/utils/shift";
import { LogOut, Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useActiveShift } from "@/lib/hooks/useShift";
import { ShiftClosingModal } from "../shift/ShiftClosingModal";

export function UserDropdown({ userProfile }: { userProfile?: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loginTime, setLoginTime] = useState<string>("");
  const { data: activeShift } = useActiveShift(userProfile?.id);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  useEffect(() => {
    // Tangkap jam realtime saat komponen di-mount / login
    const now = new Date();
    setLoginTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB");
  }, []);

  const currentShift = getAutoShift();

  const handleLogout = async () => {
    if (userProfile?.role === 'kasir' && activeShift) {
      setIsOpen(false);
      setIsShiftModalOpen(true);
      toast.info("Harap tutup shift kasir terlebih dahulu sebelum logout.");
      return;
    }

    try {
      await supabase.auth.signOut();
      toast.success("Berhasil keluar dari akun");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Gagal melakukan logout");
    }
  };

  const initial = userProfile?.full_name?.charAt(0) || userProfile?.email?.charAt(0) || "K";

  return (
    <div className="relative">
      {/* Avatar Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center hover:ring-4 hover:ring-blue-100 transition-all cursor-pointer shadow-sm"
      >
        {initial.toUpperCase()}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <>
          {/* Backdrop Click Outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* User Details */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-base">
                  {initial.toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-slate-900 text-sm truncate">{userProfile?.full_name || "Kasir BRILink"}</p>
                  <p className="text-xs text-slate-500 truncate">{userProfile?.email || "kasir@brilink.com"}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 rounded-md">
                    {userProfile?.role || "KASIR"}
                  </span>
                </div>
              </div>
            </div>

            {/* Shift Realtime Info */}
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5" /> Login</span>
                  <span className="font-semibold text-slate-800">{loginTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium"><ShieldCheck className="w-3.5 h-3.5" /> Shift</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${currentShift.color}`}>
                    {currentShift.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Keluar / Logout
              </button>
            </div>
          </div>
        </>
      )}
      {isShiftModalOpen && (
        <ShiftClosingModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
        />
      )}
    </div>
  );
}
