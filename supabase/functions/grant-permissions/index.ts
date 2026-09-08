
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(supabaseUrl, supabaseKey)

    // Execute each SQL statement
    const results = []
    const statements = [
      "CREATE ROLE kasir LOGIN PASSWORD 'kasir123' INHERIT;",
      "CREATE ROLE owner LOGIN PASSWORD 'owner123' INHERIT;",
      "CREATE ROLE developer LOGIN PASSWORD 'dev123' INHERIT;",
      "GRANT authenticated TO kasir, owner, developer;",
      "GRANT USAGE ON SCHEMA public TO kasir, owner, developer;",
      "GRANT ALL ON ALL TABLES IN SCHEMA public TO kasir, owner, developer;",
      "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO kasir, owner, developer;",
      "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO kasir, owner, developer;"
    ]

    for (const stmt of statements) {
      try {
        const { error } = await db.rpc('exec_ddl', { statement: stmt })
        results.push({ sql: stmt, success: !error, error: error?.message })
      } catch (e) {
        results.push({ sql: stmt, success: false, error: e.message })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
