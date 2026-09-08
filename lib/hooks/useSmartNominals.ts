'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_NOMINALS = [100000, 200000, 500000, 1000000, 2000000];

export function useSmartNominals(outletId?: string) {
  const supabase = createClient();

  return useQuery<number[]>({
    queryKey: ['smart-nominals', outletId],
    queryFn: async () => {
      if (!outletId) {
        return DEFAULT_NOMINALS;
      }

      try {
        const { data, error } = await supabase.rpc('get_top_round_nominals_7d', {
          p_outlet_id: outletId,
        });

        if (error) {
          console.warn('Failed to fetch smart nominals, falling back to defaults:', error.message);
          return DEFAULT_NOMINALS;
        }

        // Map data containing { nominal: string, total_tx: number } to numbers
        const fetchedNominals = (data || [])
          .map((row: any) => Number(row.nominal))
          .filter((n: number) => !isNaN(n) && n > 0);

        // Pad with default values to ensure exactly 5 presets
        const combined = Array.from(new Set([...fetchedNominals, ...DEFAULT_NOMINALS]))
          .slice(0, 5)
          .sort((a, b) => a - b);

        return combined;
      } catch (err) {
        console.error('Error fetching smart nominals from RPC:', err);
        return DEFAULT_NOMINALS;
      }
    },
    initialData: DEFAULT_NOMINALS,
    staleTime: 60000, // Cache for 1 minute
  });
}
