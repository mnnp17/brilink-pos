-- Create function to get top 5 round/even nominal transactions for an outlet in the last 7 days
CREATE OR REPLACE FUNCTION public.get_top_round_nominals_7d(p_outlet_id UUID)
RETURNS TABLE(nominal NUMERIC, total_tx BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.nominal, COUNT(*) as total_tx
  FROM public.transactions t
  WHERE t.outlet_id = p_outlet_id
    AND t.created_at >= NOW() - INTERVAL '7 days'
    AND (t.nominal % 50000 = 0) -- Filter only round nominals that are multiples of 50.000 (even)
    AND t.is_deleted = false
  GROUP BY t.nominal
  ORDER BY total_tx DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
