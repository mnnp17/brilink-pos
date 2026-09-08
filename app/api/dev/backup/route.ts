import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyDeveloperAccess } from '@/lib/api/verify-developer';

export async function GET() {
  const auth = await verifyDeveloperAccess();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const admin = createAdminClient();

    const [profiles, users, outlets, outletBalances, accounts, transactions, auditLogs] =
      await Promise.all([
        admin.from('profiles').select('*'),
        admin.from('users').select('*'),
        admin.from('outlets').select('*'),
        admin.from('outlet_balances').select('*'),
        admin.from('accounts').select('*'),
        admin.from('transactions').select('*').limit(1000),
        admin.from('audit_logs').select('*').limit(500),
      ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      data: {
        profiles: profiles.data ?? [],
        users: users.data ?? [],
        outlets: outlets.data ?? [],
        outlet_balances: outletBalances.data ?? [],
        accounts: accounts.data ?? [],
        transactions: transactions.data ?? [],
        audit_logs: auditLogs.data ?? [],
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="brilink_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate backup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
